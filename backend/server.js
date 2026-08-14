require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const { setupWSConnection } = require('y-websocket/bin/utils');
const { sequelize, Document } = require('./models/Document');
const { Execution } = require('./models/Execution');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const EXECUTOR_URL = process.env.EXECUTOR_URL || 'http://localhost:5002';

// Simple debounce utility
function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// Persistence layer: load from / save to PostgreSQL
const persistence = {
  bindState: async (docName, ydoc) => {
    try {
      const ytext = ydoc.getText('monaco');

      // Load existing content from DB
      const doc = await Document.findByPk(docName);
      if (doc && doc.content && ytext.length === 0) {
        ytext.insert(0, doc.content);
      }

      // Auto-save on changes (debounced)
      const saveToDb = debounce(async () => {
        try {
          const content = ytext.toString();
          await Document.upsert({
            id: docName,
            name: docName,
            content: content,
            language: 'javascript',
            updatedAt: new Date(),
          });
        } catch (err) {
          console.error('Auto-save failed:', err.message);
        }
      }, 2000);

      ydoc.on('update', saveToDb);

    } catch (err) {
      console.error('bindState error:', err.message);
    }
  },

  writeState: async (docName, ydoc) => {
    try {
      const ytext = ydoc.getText('monaco');
      await Document.upsert({
        id: docName,
        name: docName,
        content: ytext.toString(),
        language: 'javascript',
        updatedAt: new Date(),
      });
    } catch (err) {
      console.error('writeState error:', err.message);
    }
  },
};

// WebSocket server on same port as Express
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  // Extract room ID from URL path (e.g., /test-room)
  const docName = decodeURIComponent(req.url.slice(1).split('?')[0]) || 'default';
  console.log(`WS connection: room=${docName}`);

  setupWSConnection(ws, req, {
    docName,
    gc: true,
    persistence,
  });
});

// REST API endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/api/documents/:id', async (req, res) => {
  try {
    const doc = await Document.findByPk(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/documents/:id', async (req, res) => {
  try {
    const { name, content, language } = req.body;
    const [doc, created] = await Document.upsert({
      id: req.params.id,
      name: name || req.params.id,
      content: content || '',
      language: language || 'javascript',
      updatedAt: new Date(),
    });
    res.json({ doc, created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== CODE EXECUTION ==========
app.post('/api/execute', async (req, res) => {
  try {
    const { code, language, roomId, userName } = req.body;

    if (!code || !language) {
      return res.status(400).json({ error: 'Missing code or language' });
    }

    const response = await fetch(`${EXECUTOR_URL}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();

    // Save execution to database
    try {
      await Execution.create({
        roomId: roomId || 'unknown',
        userName: userName || 'Anonymous',
        language,
        code: code.slice(0, 50000), // limit to 50KB
        output: (data.output || '').slice(0, 10000),
        error: (data.error || '').slice(0, 10000),
        exitCode: data.exitCode ?? -1,
        executionTime: data.executionTime ?? 0,
      });
    } catch (dbErr) {
      console.error('Failed to save execution:', dbErr.message);
    }

    res.json(data);
  } catch (err) {
    console.error('Execution proxy error:', err.message);
    res.status(500).json({ error: 'Execution service unavailable', detail: err.message });
  }
});

// ========== EXECUTION HISTORY ==========
app.get('/api/executions/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const executions = await Execution.findAll({
      where: { roomId },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json(executions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sync DB and start server
const PORT = process.env.PORT || 5001;

sequelize.sync({ alter: true }).then(() => {
  console.log('PostgreSQL connected & models synced.');
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`WebSocket ready on ws://localhost:${PORT}/<room-id>`);
  });
}).catch((err) => {
  console.error('DB connection failed:', err.message);
  server.listen(PORT, () => {
    console.log(`Server running (DB unavailable) on port ${PORT}`);
  });
});

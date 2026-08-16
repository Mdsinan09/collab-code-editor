require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const Y = require('yjs');
const { setupWSConnection } = require('y-websocket/bin/utils');
const { sequelize, Document } = require('./models/Document');
const { Execution } = require('./models/Execution');
const { File } = require('./models/File');
const { ChatMessage } = require('./models/ChatMessage');
const User = require('./models/User');
const authRoutes = require('./routes/auth');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

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
      const filesMap = ydoc.getMap('files');
      const roomState = ydoc.getMap('roomState');
      const chatArray = ydoc.getArray('chat');

      // Only load from DB if document is empty (first connection)
      if (filesMap.size === 0) {
        // Load files
        const dbFiles = await File.findAll({
          where: { roomId: docName },
          order: [['createdAt', 'ASC']],
        });

        if (dbFiles.length > 0) {
          dbFiles.forEach((dbFile) => {
            const fileMap = new Y.Map();
            fileMap.set('name', dbFile.name);
            fileMap.set('language', dbFile.language);
            const ytext = new Y.Text();
            if (dbFile.content) ytext.insert(0, dbFile.content);
            fileMap.set('content', ytext);
            filesMap.set(dbFile.id, fileMap);
          });
          roomState.set('activeFileId', dbFiles[0].id);
        } else {
          const defaultId = 'file-' + Date.now();
          const fileMap = new Y.Map();
          fileMap.set('name', 'index.js');
          fileMap.set('language', 'javascript');
          const ytext = new Y.Text();
          fileMap.set('content', ytext);
          filesMap.set(defaultId, fileMap);
          roomState.set('activeFileId', defaultId);
        }

        // Load chat messages
        const dbMessages = await ChatMessage.findAll({
          where: { roomId: docName },
          order: [['createdAt', 'ASC']],
          limit: 200,
        });

        dbMessages.forEach((msg) => {
          const msgMap = new Y.Map();
          msgMap.set('id', msg.id);
          msgMap.set('userName', msg.userName);
          msgMap.set('userColor', msg.userColor);
          msgMap.set('text', msg.text);
          msgMap.set('timestamp', msg.createdAt.toISOString());
          chatArray.push([msgMap]);
        });
      }

      // Auto-save files and chat on change (debounced)
      const saveToDb = debounce(async () => {
        try {
          // Save files
          const entries = Array.from(filesMap.entries());
          for (const [fileId, fileMap] of entries) {
            const ytext = fileMap.get('content');
            await File.upsert({
              id: fileId,
              roomId: docName,
              name: fileMap.get('name'),
              language: fileMap.get('language'),
              content: ytext.toString(),
              updatedAt: new Date(),
            });
          }

          // Save chat messages (only new ones)
          const existingIds = new Set((await ChatMessage.findAll({
            where: { roomId: docName },
            attributes: ['id'],
          })).map(m => m.id));

          for (let i = 0; i < chatArray.length; i++) {
            const msgMap = chatArray.get(i);
            const msgId = msgMap.get('id');
            if (!existingIds.has(msgId)) {
              await ChatMessage.create({
                id: msgId,
                roomId: docName,
                userName: msgMap.get('userName'),
                userColor: msgMap.get('userColor'),
                text: msgMap.get('text'),
                createdAt: new Date(msgMap.get('timestamp')),
              });
            }
          }
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
      const filesMap = ydoc.getMap('files');
      const chatArray = ydoc.getArray('chat');

      // Save all files
      const entries = Array.from(filesMap.entries());
      for (const [fileId, fileMap] of entries) {
        const ytext = fileMap.get('content');
        await File.upsert({
          id: fileId,
          roomId: docName,
          name: fileMap.get('name'),
          language: fileMap.get('language'),
          content: ytext.toString(),
          updatedAt: new Date(),
        });
      }

      // Save all chat messages
      const existingIds = new Set((await ChatMessage.findAll({
        where: { roomId: docName },
        attributes: ['id'],
      })).map(m => m.id));

      for (let i = 0; i < chatArray.length; i++) {
        const msgMap = chatArray.get(i);
        const msgId = msgMap.get('id');
        if (!existingIds.has(msgId)) {
          await ChatMessage.create({
            id: msgId,
            roomId: docName,
            userName: msgMap.get('userName'),
            userColor: msgMap.get('userColor'),
            text: msgMap.get('text'),
            createdAt: new Date(msgMap.get('timestamp')),
          });
        }
      }
    } catch (err) {
      console.error('writeState error:', err.message);
    }
  },
};

// WebSocket server on same port as Express
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
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

app.get('/api/rooms/:roomId/files', async (req, res) => {
  try {
    const files = await File.findAll({
      where: { roomId: req.params.roomId },
      order: [['createdAt', 'ASC']],
    });
    res.json(files);
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

// ========== CHAT HISTORY ==========
app.get('/api/chat/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 200 } = req.query;

    const messages = await ChatMessage.findAll({
      where: { roomId },
      order: [['createdAt', 'ASC']],
      limit: parseInt(limit),
    });

    res.json(messages);
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

const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const MAX_EXECUTION_TIME = 15000; // 15 seconds
const TEMP_DIR = '/tmp/executor';

// Ensure temp dir exists (created in Dockerfile, but safety check)
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

function cleanup(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch (e) {}
}

function runCommand(command, cwd, timeout) {
  return new Promise((resolve) => {
    const startTime = Date.now();

    exec(command, {
      timeout,
      maxBuffer: 1024 * 1024, // 1MB output limit
      cwd,
      env: {
        PATH: process.env.PATH,
        HOME: process.env.HOME,
      },
    }, (error, stdout, stderr) => {
      const executionTime = Date.now() - startTime;

      if (error && error.killed) {
        resolve({
          output: stdout,
          error: 'Execution timed out (15s limit)',
          exitCode: -1,
          executionTime,
        });
        return;
      }

      resolve({
        output: stdout,
        error: stderr || (error ? error.message : ''),
        exitCode: error ? error.code : 0,
        executionTime,
      });
    });
  });
}

app.post('/execute', async (req, res) => {
  const { code, language } = req.body;

  if (!code || !language) {
    return res.status(400).json({ error: 'Missing code or language' });
  }

  const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
  const workDir = path.join(TEMP_DIR, id);
  fs.mkdirSync(workDir, { recursive: true });

  let result;

  try {
    switch (language) {
      case 'javascript': {
        const filePath = path.join(workDir, 'main.js');
        fs.writeFileSync(filePath, code);
        result = await runCommand(`node "${filePath}"`, workDir, MAX_EXECUTION_TIME);
        break;
      }

      case 'python': {
        const filePath = path.join(workDir, 'main.py');
        fs.writeFileSync(filePath, code);
        result = await runCommand(`python3 "${filePath}"`, workDir, MAX_EXECUTION_TIME);
        break;
      }

      case 'java': {
        // Extract public class name, fallback to Main
        const classMatch = code.match(/public\s+class\s+(\w+)/);
        const className = classMatch ? classMatch[1] : 'Main';
        const filePath = path.join(workDir, `${className}.java`);
        fs.writeFileSync(filePath, code);
        const compile = await runCommand(`javac "${filePath}"`, workDir, MAX_EXECUTION_TIME);
        if (compile.exitCode !== 0) {
          result = compile;
        } else {
          result = await runCommand(`java -cp "${workDir}" ${className}`, workDir, MAX_EXECUTION_TIME);
        }
        break;
      }

      case 'cpp': {
        const sourcePath = path.join(workDir, 'main.cpp');
        const binaryPath = path.join(workDir, 'main');
        fs.writeFileSync(sourcePath, code);
        const compile = await runCommand(`g++ -o "${binaryPath}" "${sourcePath}"`, workDir, MAX_EXECUTION_TIME);
        if (compile.exitCode !== 0) {
          result = compile;
        } else {
          result = await runCommand(`"${binaryPath}"`, workDir, MAX_EXECUTION_TIME);
        }
        break;
      }

      default:
        cleanup(workDir);
        return res.status(400).json({ error: `Unsupported language: ${language}` });
    }

    res.json(result);

  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    cleanup(workDir);
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Executor service running on port ${PORT}`);
});

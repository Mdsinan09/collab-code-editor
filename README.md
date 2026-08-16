# Real-Time Collaborative Code Editor

A full-stack, real-time collaborative code editor supporting multi-file workspaces, live presence cursors, isolated multi-language code execution, and execution history.

## Features

- **Multi-file workspace**: Create, rename, select, and delete files (`.js`, `.py`, `.java`, `.cpp`).
- **Real-time collaboration**: Yjs CRDTs sync edits instantly across all clients.
- **Live user presence**: Colored cursors, floating name tags, active user list.
- **Code execution**: Run JavaScript, Python, Java, and C++ in isolated Docker containers.
- **Execution history**: Track who ran what, when, with full output. Re-run any past execution.
- **Export**: Download, copy, or share room links.
- **Production-ready**: Docker, nginx, SSL support. Deploy anywhere.

## Quick Start (Development)

```bash
# 1. Start backend + database + executor
docker compose up --build

# 2. In another terminal, start frontend
cd frontend && npm install && npm start

# 3. Open http://localhost:3000/room/test-room
```

## Quick Deploy (Production)

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env with your settings

# 2. Build and deploy
./deploy.sh

# 3. Setup SSL (optional but recommended)
./setup-ssl.sh your-domain.com your-email@example.com
```

See [DEPLOY.md](DEPLOY.md) for detailed deployment instructions.

## Architecture

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│  React  │────▶│ Backend │────▶│   DB    │
│ Frontend│◀────│ Express │◀────│PostgreSQL│
│ :3000   │ WS  │ :5000   │     │ :5432   │
└─────────┘     └────┬────┘     └─────────┘
                     │
                     ▼
              ┌─────────┐
              │ Executor│
              │:5002    │
              └─────────┘
```

## Project Structure

```
collab-editor/
├── backend/           # Express + y-websocket server
│   ├── models/        # Sequelize models (db, Document, File, Execution)
│   ├── server.js      # Main server
│   └── Dockerfile
├── executor/          # Isolated code execution
│   ├── server.js
│   └── Dockerfile
├── frontend/          # React + Monaco + Yjs
│   ├── src/
│   │   ├── components/  # Editor, FileTree, Tabs, Header, etc.
│   │   ├── hooks/
│   │   └── pages/
│   └── Dockerfile
├── nginx/             # nginx config
│   └── nginx.conf
├── docker-compose.yml      # Development
├── docker-compose.prod.yml # Production
├── deploy.sh               # One-command deploy
├── setup-ssl.sh            # SSL certificate setup
├── .env.example            # Environment template
└── DEPLOY.md               # Full deployment guide
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/rooms/:roomId/files` | List files in room |
| POST | `/api/execute` | Execute code |
| GET | `/api/executions/:roomId` | Execution history |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_USER` | postgres | Database username |
| `DB_PASSWORD` | changeme | Database password |
| `DB_NAME` | collabeditor | Database name |
| `JWT_SECRET` | changeme | Secret for auth tokens |
| `EXECUTOR_URL` | http://executor:5002 | Executor service URL |
| `DOMAIN` | - | Domain for SSL |
| `EMAIL` | - | Email for SSL notifications |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js, Express, y-websocket, Sequelize, PostgreSQL |
| Executor | Node.js, Python 3, OpenJDK, G++ |
| Frontend | React, Monaco Editor, Yjs, y-monaco, Tailwind CSS |
| Proxy | nginx |
| Infra | Docker, Docker Compose |

## License

MIT

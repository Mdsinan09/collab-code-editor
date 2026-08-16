# SyncLab — Real-Time Collaborative IDE & System Design Project

> **"I spent the last few weeks building a real-time collaborative code editor from scratch. Here's what I shipped."**

Meet **SyncLab** — a full-stack, production-deployed collaborative workspace where teams write, run, and review code together in real time. No "paste into Slack." No "can you check my screen?" Just open a room and code.

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Production%20Ready-blue.svg)](https://www.docker.com/)
[![React](https://img.shields.io/badge/React-18-cyan.svg)](https://reactjs.org/)
[![Monaco Editor](https://img.shields.io/badge/Monaco%20Editor-VS%20Code%20Engine-blueviolet.svg)](https://microsoft.github.io/monaco-editor/)
[![Yjs CRDT](https://img.shields.io/badge/Yjs-CRDT%20Sync-orange.svg)](https://yjs.dev/)

---

## 🚀 Engineering Breakdown (What I Built)

### 🔧 1. Frontend & UI System
- **Engine**: Powered by **React 18** and **Monaco Editor** (the exact editor engine driving Microsoft VS Code).
- **Styling**: Tailored dark-mode aesthetic built with **Tailwind CSS**.
- **Branding & Experience**: Responsive product landing page (`LandingPage.jsx`) featuring mouse-tracking ambient glow, instant room generator, and multi-stage animated splash intro screen (`LoadingScreen.jsx`).

### ⚡ 2. Real-Time Collaboration (CRDT Engine)
- **State Synchronization**: Powered by **Yjs Conflict-free Replicated Data Types (CRDTs)** over WebSockets (`y-websocket`).
- **Conflict Handling**: Every character edit propagates across all connected clients in real time with mathematical determinism. Zero manual merge conflicts, zero page refreshes.

### 👥 3. Live User Presence & Remote Cursors
- **Presence Tracking**: Integrated with **Yjs Awareness** protocol to broadcast cursor positions, text selections, and user identities.
- **Visual Feedback**: Renders custom Monaco cursor line decorations and floating name tags with deterministic user colors (`#ef4444`, `#10b981`, `#3b82f6`, etc.). Watch teammates' cursors move character-by-character in real time.

### 💬 4. In-Room Integrated Chat
- **Document-Level Chat**: Messages are stored inside `ydoc.getArray('chat')`, inheriting CRDT real-time properties without needing a separate WebSocket channel.
- **Persistence & UI**: Automatically saved to PostgreSQL (`chat_messages` table). Features compact message grouping, timestamp formatting, auto-scrolling, and red unread notification badges on both the sidebar tab and header toggle button.

### 📁 5. Multi-File Workspaces
- **Workspace File System**: Full multi-file project management (`File.js` model + Yjs `filesMap` deep observation).
- **Features**: Create, rename, and delete files with dynamic language detection (`.js`, `.py`, `.java`, `.cpp`). Integrated tab bar with colored language badges.

### ▶️ 6. Isolated Multi-Language Code Execution Engine
- **Sandboxed Execution**: Custom Node.js microservice (`collab-executor`) running in an isolated Docker container equipped with **Node.js v20**, **Python 3**, **OpenJDK (Java)**, and **G++ (C++)**.
- **Safety Guards**: Enforces 15-second execution timeout, 1MB max buffer output limit, and auto-deleting unique temporary working directories.

### 📊 7. Execution History & Audit Log
- **Run Tracking**: Stores execution records in PostgreSQL (`executions` table) capturing initiator username, filename, code snapshot, STDOUT output, STDERR errors, exit codes, and execution time in milliseconds.
- **1-Click Re-Run**: Sidebar history panel with expandable logs and a one-click **Re-run** action that loads historical code back into the editor.

### 🔐 8. JWT User Authentication System
- **Identity Provider**: `bcryptjs` password hashing and 7-day signed **JSON Web Tokens (JWT)** via Express middleware.
- **Persistent User Identities**: Authenticated users retain their display name and assigned avatar color across all rooms. Includes dark-themed `AuthModal` (Sign In / Register) and header user dropdown with **Sign Out**.

### 🐳 9. Production Deployment Suite
- **Infrastructure**: Complete **Docker Compose** production suite (`docker-compose.prod.yml`) featuring **NGINX** reverse proxying static React bundles on port 80/443, Node.js API + WebSocket server (port 5001), Executor sandbox (port 5002), and PostgreSQL 15.
- **Automation**: Includes one-command deployment (`./deploy.sh`) and automated Let's Encrypt SSL script (`./setup-ssl.sh`).

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              NGINX Reverse Proxy                            │
│                              (Port 80 / 443 SSL)                            │
└──────┬──────────────────────────────┬──────────────────────────────┬────────┘
       │ HTTP / Static Assets         │ REST API & WebSockets        │
       ▼                              ▼                              │
┌──────────────┐              ┌──────────────┐                       │
│ React App    │              │ Express API  │                       │
│ (Monaco+Yjs) │              │ & Y-WS Server│                       │
└──────────────┘              └──────┬───────┘                       │
                                     │                               │
                      ┌──────────────┴──────────────┐                │
                      ▼                             ▼                ▼
              ┌──────────────┐              ┌──────────────┐  ┌─────────────┐
              │ PostgreSQL 15│              │ Execution    │  │ Yjs CRDT    │
              │ (Auth, Chat, │              │ Service      │  │ State Map   │
              │ History, File│              │ (Docker DB)  │  │ (In-Memory) │
              └──────────────┘              └──────────────┘  └─────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Monaco Editor, Yjs, y-monaco, y-websocket, Tailwind CSS |
| **Backend** | Node.js, Express, y-websocket, Sequelize ORM, JWT, bcryptjs |
| **Database** | PostgreSQL 15 (Docker containerized) |
| **Code Executor** | Docker container (Node.js, Python 3, OpenJDK, G++) |
| **Reverse Proxy** | NGINX (Static file hosting, API proxying, WebSocket upgrades) |
| **Infrastructure** | Docker, Docker Compose, Bash scripts |

---

## 🚀 Quick Start (Development)

### Prerequisites
- [Docker](https://www.docker.com/) & Docker Compose
- Node.js v18+

### 1. Clone & Install
```bash
git clone https://github.com/Mdsinan09/collab-code-editor.git
cd collab-code-editor/collab-editor
```

### 2. Start Backend, DB & Executor
```bash
docker compose up -d --build
```

### 3. Start Frontend Development Server
```bash
cd frontend
npm install
PORT=3000 npm start
```

Open `http://localhost:3000` in your browser.

---

## 🌐 Production Deployment Guide

### 1. Environment Setup
```bash
cd collab-editor
cp .env.example .env
```
Generate a secure JWT secret:
```bash
openssl rand -hex 32
```
Edit `.env`:
```env
DB_NAME=collab_db
DB_USER=postgres
DB_PASSWORD=your-secure-password
JWT_SECRET=your-64-character-hex-secret
```

### 2. Build & Deploy
```bash
cd frontend && npm run build && cd ..
docker compose -f docker-compose.prod.yml up --build -d
```

### 3. Verify Health Check
```bash
curl http://localhost/api/health
# Output: {"status":"ok"}
```

Access your live instance at `http://localhost` (or your server domain/IP).

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

**Built by [Mdsinan09](https://github.com/Mdsinan09)** · Shipped with passion for system design.

# Real-Time Collaborative Code Editor

A real-time collaborative code editor with **live user presence**, **code execution**, and **export features** built with Node.js + Express + y-websocket on the backend and React + Monaco Editor + Yjs on the frontend.

## Features

- **Real-time collaboration**: Multiple users edit the same document simultaneously with instant sync
- **Live user presence**: See who's in the room with colored cursors, floating name tags, and a user list sidebar
- **Code execution**: Run JavaScript, Python, Java, and C++ code in isolated Docker containers
- **Export**: Download code as `.js`, `.py`, `.java`, or `.cpp`, copy to clipboard, or share room links
- **Persistent documents**: Auto-saved to PostgreSQL — close the tab and come back later

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   React     │────▶│   Backend   │────▶│ PostgreSQL  │
│  Frontend   │◀────│  (Express)  │◀────│     DB      │
│  :3000      │ WS  │  :5001      │     │  :5432      │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                           │ HTTP
                           ▼
                    ┌─────────────┐
                    │  Executor   │
                    │  (isolated) │
                    │  :5002      │
                    └─────────────┘
```

- **Backend**: Express HTTP + y-websocket WS on same port (5001). Forwards execution requests to executor.
- **Frontend**: React with Monaco Editor bound to Yjs. Awareness protocol tracks cursors and user presence.
- **Database**: PostgreSQL 15 for document persistence.
- **Executor**: Isolated Docker container with Node, Python, Java, and C++ compilers.

## Project Structure

```
collab-editor/
├── backend/
│   ├── server.js           # Express + y-websocket + execution proxy
│   ├── models/
│   │   └── Document.js     # Sequelize model
│   ├── package.json
│   ├── Dockerfile
│   └── .env
├── executor/
│   ├── server.js           # Isolated code execution service
│   ├── package.json
│   └── Dockerfile          # Node + Python + Java + C++
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # React Router
│   │   ├── components/
│   │   │   ├── Editor.jsx      # Monaco + Yjs + Awareness cursors
│   │   │   ├── Header.jsx      # Room header with controls
│   │   │   ├── Toast.jsx       # Toast notification hook
│   │   │   ├── UserList.jsx    # Sidebar user list
│   │   │   └── UsernameModal.jsx # Username prompt modal
│   │   ├── hooks/
│   │   │   └── useLocalStorage.js
│   │   └── pages/
│   │       └── Room.jsx        # Room page orchestrator
│   ├── public/
│   ├── package.json
│   └── tailwind.config.js
└── docker-compose.yml
```

## Quick Start

### 1. Start All Services (Docker)

```bash
cd collab-editor
docker compose up --build
```

This starts three services:
- **PostgreSQL** on `localhost:5432`
- **Backend** on `http://localhost:5001`
- **Executor** on `http://localhost:5002`

### 2. Start Frontend (Dev Server)

In a new terminal:

```bash
cd collab-editor/frontend
npm install
npm start
```

The frontend runs on `http://localhost:3000`.

### 3. Test Real-Time Collaboration & Presence

1. Open Browser 1: `http://localhost:3000/room/test-room`
2. Enter a username when prompted (stored in localStorage)
3. Open Browser 2 (incognito): `http://localhost:3000/room/test-room`
4. Enter a different username
5. **Type in either editor** — both see changes instantly
6. **Move your cursor** — see colored cursors with floating name tags in the other browser
7. **Open the sidebar** (hamburger menu) to see the user list

### 4. Test Code Execution

1. Click **"Sample"** to load starter code
2. Click **"Run"** — output appears in the bottom console panel
3. Switch languages and run again

### 5. Test Export Features

1. Click **"Export"** dropdown in the header
2. **Download** — saves file as `room-id.js` (or `.py`, `.java`, `.cpp`)
3. **Copy to Clipboard** — copies code with toast confirmation
4. **Share Room Link** — copies URL to clipboard

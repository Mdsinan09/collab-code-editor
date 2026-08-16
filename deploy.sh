#!/bin/bash
set -e

echo "Building Collab Editor for production..."

# 1. Build frontend
echo "→ Building React frontend..."
cd frontend
npm install
npm run build
cd ..

# 2. Start production stack
echo "→ Starting Docker production stack..."
docker compose -f docker-compose.prod.yml up --build -d

echo ""
echo "✅ Collab Editor is running!"
echo "   Frontend: http://localhost"
echo "   Backend API: http://localhost/api"
echo "   WebSocket: ws://localhost/<room-id>"
echo ""
echo "To view logs: docker compose -f docker-compose.prod.yml logs -f"
echo "To stop: docker compose -f docker-compose.prod.yml down"

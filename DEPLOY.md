# Deployment Guide

Deploy your Collab Editor to production with Docker, nginx, and optional SSL.

## Quick Deploy (Local / LAN)

```bash
# 1. Build and start everything
./deploy.sh

# 2. Open http://localhost
```

## Production Deploy (VPS / Cloud)

### Prerequisites

- A Linux server (Ubuntu 22.04 recommended)
- Docker & Docker Compose installed
- A domain name pointing to your server (for SSL)
- Ports 80 and 443 open

### Step 1: Clone & Configure

```bash
git clone <your-repo> collab-editor
cd collab-editor

# Copy and edit environment variables
cp .env.example .env
nano .env
```

Edit `.env`:
```env
DB_USER=postgres
DB_PASSWORD=your-secure-db-password
DB_NAME=collabeditor
JWT_SECRET=your-super-secret-random-string
DOMAIN=editor.yourdomain.com
EMAIL=you@yourdomain.com
```

### Step 2: Build Frontend

```bash
cd frontend
npm install
npm run build
cd ..
```

### Step 3: Start Services

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

### Step 4: Setup SSL (HTTPS)

```bash
./setup-ssl.sh editor.yourdomain.com you@yourdomain.com
```

Then edit `nginx/nginx.conf`:
1. Uncomment the HTTP → HTTPS redirect
2. Uncomment the HTTPS server block
3. Set `server_name editor.yourdomain.com;`

```bash
docker compose -f docker-compose.prod.yml restart nginx
```

### Step 5: Verify

```bash
# Check all containers are running
docker ps

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Test health
curl http://localhost/api/health
```

## Cloud Platform Specifics

### DigitalOcean

1. Create a Droplet (2GB RAM minimum)
2. Install Docker: `curl -fsSL https://get.docker.com | sh`
3. Clone repo, follow steps above
4. Optionally use DigitalOcean App Platform with `docker-compose.prod.yml`

### AWS EC2

1. Launch Ubuntu 22.04 instance (t3.small minimum)
2. Open ports 80, 443, 22 in security group
3. Install Docker, follow steps above
4. Use Elastic IP for stable domain mapping

### Railway / Render / Fly.io

These platforms support Docker Compose or Dockerfile deployment:

**Railway:**
```bash
railway login
railway init
railway up
```

**Render:**
- Use `docker-compose.prod.yml` as blueprint
- Add PostgreSQL managed database
- Set environment variables in dashboard

**Fly.io:**
```bash
fly launch --dockerfile backend/Dockerfile
fly scale count 2  # for backend redundancy
```

## Updating Production

```bash
# Pull latest code
git pull

# Rebuild and restart
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up --build -d

# Database migrations happen automatically (sequelize.sync)
```

## Monitoring

```bash
# Container stats
docker stats

# Backend logs
docker logs -f collab-backend --tail 100

# Database size
docker exec collab-db psql -U postgres -c "\dt+"

# Active connections
docker exec collab-db psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"
```

## Troubleshooting

**nginx 502 Bad Gateway:**
```bash
docker compose -f docker-compose.prod.yml logs backend
# Check backend is healthy: docker exec collab-backend wget -qO- http://localhost:5000/api/health
```

**WebSocket not connecting:**
- Verify nginx config has the WebSocket location block
- Check `proxy_set_header Connection "upgrade"` is present
- Ensure firewall allows port 80/443

**Database connection failed:**
```bash
docker compose -f docker-compose.prod.yml ps
# Ensure db is healthy before backend starts
docker compose -f docker-compose.prod.yml restart backend
```

**Frontend shows blank page:**
```bash
# Check build output exists
ls frontend/build/index.html
# Rebuild: cd frontend && npm run build
```

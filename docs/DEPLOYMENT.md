# Findora Deployment Guide

Central index for production and demo deployment.

---

## Recommended production stack

| Component | Platform | Config file |
|-----------|----------|-------------|
| Frontend | **Vercel** | `client/vercel.json` |
| API + Socket.IO | **Render** | `render.yaml` |
| Database | **MongoDB Atlas** | — |
| Cache | **Upstash Redis** | — |
| Media | **Cloudinary** | — |
| AI text | **OpenAI** | — |
| AI image (optional) | **Hugging Face** | — |

---

## Quick start (demo)

Follow the full walkthrough: **[DEMO_DEPLOYMENT_GUIDE.md](./DEMO_DEPLOYMENT_GUIDE.md)**

Summary:

1. Create MongoDB Atlas cluster → `MONGODB_URI`
2. Create Upstash Redis → `REDIS_URL`
3. Create Cloudinary account → `CLOUDINARY_*`
4. Deploy API to Render using `render.yaml`
5. Deploy client to Vercel with `VITE_API_URL`
6. Set `CLIENT_URL` on Render to Vercel URL → redeploy API
7. Run post-deploy verification

---

## Environment files

| File | Purpose |
|------|---------|
| `server/.env.example` | Local development template |
| `server/.env.production.example` | Production API template (Render) |
| `client/.env.example` | Local client template |
| `client/.env.production.example` | Production client template (Vercel) |

Verify before deploy:

```bash
cd server
NODE_ENV=production npm run verify:env
NODE_ENV=production npm run verify:env -- --deep
```

Full reference: **[ENV_VARIABLES.md](./ENV_VARIABLES.md)**

---

## Platform configuration

### Vercel (frontend)

| Setting | Value |
|---------|-------|
| Root Directory | `client` |
| Build | `npm run build` |
| Output | `dist` |
| Env | `VITE_API_URL=https://your-api.onrender.com` |

`client/vercel.json` handles SPA routing and asset caching.

### Render (backend)

| Setting | Value |
|---------|-------|
| Root Directory | `server` |
| Build | `npm ci` |
| Start | `node index.js` |
| Health Check | `/api/health/ready` |

Use `render.yaml` blueprint or configure manually. Render injects `PORT` automatically.

### MongoDB Atlas

Connection string format:

```
mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/findora?retryWrites=true&w=majority
```

Allow Render egress IPs in Network Access.

### Upstash Redis

Use the TLS URL (`rediss://...`) as `REDIS_URL`.

---

## CORS & Socket.IO

| Variable | Set on | Purpose |
|----------|--------|---------|
| `CLIENT_URL` | Render | CORS + Socket.IO allowed origin |
| `VITE_API_URL` | Vercel | API + WebSocket target |

**Important:** Vercel hosts static files only. Socket.IO connects to Render.

Verification guide: **[CORS_AND_SOCKETIO.md](./CORS_AND_SOCKETIO.md)**

---

## Health endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/health/live` | Liveness (process running) |
| `GET /api/health/ready` | Readiness (MongoDB, Redis, Cloudinary, AI) |
| `GET /api/health` | Shallow dashboard status |

Render health check should use `/api/health/ready`.

---

## Docker (local/staging)

```bash
docker compose -f docker/docker-compose.yml up --build
curl http://localhost:5001/api/health/ready
```

Guide: **[DOCKER_VERIFICATION.md](./DOCKER_VERIFICATION.md)**

---

## Checklists & plans

| Document | When to use |
|----------|-------------|
| [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) | Before every deploy |
| [POST_DEPLOYMENT_VERIFICATION.md](./POST_DEPLOYMENT_VERIFICATION.md) | Immediately after deploy |
| [ROLLBACK_PLAN.md](./ROLLBACK_PLAN.md) | If deploy fails |
| [PRODUCTION_READINESS_REPORT.md](./PRODUCTION_READINESS_REPORT.md) | Architecture audit |

---

## Critical env pairing

```
# Render (server)
CLIENT_URL=https://findora.vercel.app

# Vercel (client)
VITE_API_URL=https://findora-api.onrender.com
```

Both must use **HTTPS**. No trailing slashes.

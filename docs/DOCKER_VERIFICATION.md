# Docker Verification Guide

Use Docker for local/staging validation before deploying to Render + Vercel.

---

## Files

| File | Purpose |
|------|---------|
| `docker/Dockerfile.api` | Production API image (Node 20 Alpine) |
| `docker/docker-compose.yml` | API + MongoDB + Redis stack |

---

## Quick start

```bash
# 1. Create local env from template
cp server/.env.production.example server/.env
# Edit server/.env — for compose, MONGODB_URI/REDIS_URL are overridden by compose

# 2. Build and run
docker compose -f docker/docker-compose.yml up --build

# 3. Verify health
curl -s http://localhost:5001/api/health/ready | jq .
curl -s http://localhost:5001/api/health/live
```

---

## Compose service checks

| Service | Port | Health probe |
|---------|------|--------------|
| `api` | 5001 | `GET /api/health/ready` |
| `mongo` | 27017 | `mongosh ping` |
| `redis` | 6379 | `redis-cli ping` |

Compose waits for healthy MongoDB and Redis before starting API.

---

## Verification checklist

- [ ] `docker compose up --build` completes without errors
- [ ] `curl localhost:5001/api/health/ready` returns HTTP 200
- [ ] `services.mongo.status` is `"up"`
- [ ] `services.redis.status` is `"up"` (when `REDIS_URL` set in compose)
- [ ] API logs show `MongoDB connected` and `Findora API listening`
- [ ] Client pointed at `http://localhost:5001` can login (set `client/.env`)

---

## Dockerfile verification

```bash
docker build -f docker/Dockerfile.api -t findora-api:test .
docker run --rm -p 5001:5001 \
  -e NODE_ENV=production \
  -e MONGODB_URI="mongodb+srv://..." \
  -e JWT_SECRET="$(openssl rand -base64 48)" \
  -e CLIENT_URL="http://localhost:5173" \
  -e OPENAI_API_KEY="sk-..." \
  findora-api:test
```

Built-in `HEALTHCHECK` polls `/api/health/ready` every 30s.

---

## Docker vs production hosts

| Concern | Docker (local) | Render + Atlas + Upstash |
|---------|----------------|-------------------------|
| MongoDB | Local container | MongoDB Atlas |
| Redis | Local container | Upstash |
| Uploads | Volume mount | Cloudinary |
| WebSocket | localhost:5001 | Render HTTPS |
| CORS | `CLIENT_URL=http://localhost:5173` | Vercel HTTPS URL |

Docker validates the **API image and health endpoints**. Production deploy uses external managed services.

---

## Troubleshooting

| Issue | Action |
|-------|--------|
| API exits on start | Run `NODE_ENV=production npm run verify:env` with same `.env` |
| Health 503 | Check Mongo/Redis container logs |
| Port in use | Change compose port mapping or stop local Mongo/Redis |

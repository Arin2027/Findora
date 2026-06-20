# Findora Demo Deployment Guide

Step-by-step guide to deploy Findora for a **live demo** using:

| Layer | Platform |
|-------|----------|
| Frontend | Vercel |
| Backend | Render |
| Database | MongoDB Atlas |
| Cache | Upstash Redis |
| Media | Cloudinary |
| AI | OpenAI + Hugging Face (optional) |

Estimated setup time: **45–60 minutes** (excluding DNS propagation).

---

## Architecture

```
┌─────────────────┐     HTTPS API + WebSocket      ┌─────────────────┐
│  Vercel         │ ─────────────────────────────► │  Render         │
│  (React/Vite)   │     VITE_API_URL               │  (Express API)  │
│  CLIENT_URL ◄───┼──────────────── CORS ──────────┤  Socket.IO      │
└─────────────────┘                                └────────┬────────┘
                                                            │
                    ┌───────────────────────────────────────┼────────────────┐
                    │                                       │                │
              ┌─────▼─────┐   ┌──────────┐   ┌─────────────▼──┐   ┌────────▼────────┐
              │ MongoDB   │   │ Upstash  │   │ Cloudinary     │   │ OpenAI / HF     │
              │ Atlas     │   │ Redis    │   │ (images)       │   │ (matching)      │
              └───────────┘   └──────────┘   └────────────────┘   └─────────────────┘
```

---

## Phase 0 — Prerequisites

- [ ] GitHub repo with Findora code pushed
- [ ] Accounts: [Vercel](https://vercel.com), [Render](https://render.com), [MongoDB Atlas](https://cloud.mongodb.com), [Upstash](https://upstash.com), [Cloudinary](https://cloudinary.com), [OpenAI](https://platform.openai.com)
- [ ] Optional: [Hugging Face](https://huggingface.co/settings/tokens) for image matching

---

## Phase 1 — MongoDB Atlas

1. **Create cluster** → M0 free tier → region near Render (e.g. Oregon/US-West)
2. **Database Access** → Add user → username/password → role `Atlas admin` or `readWrite` on `findora`
3. **Network Access** → Add IP → `0.0.0.0/0` (demo only; restrict in production)
4. **Connect** → Drivers → copy connection string:
   ```
   mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/findora?retryWrites=true&w=majority
   ```
5. Save as `MONGODB_URI`

**Verify:** Connect with MongoDB Compass or Atlas shell.

---

## Phase 2 — Upstash Redis

1. Upstash Console → **Create database** → region near Render
2. Copy **UPSTASH_REDIS_REST_URL** is NOT used — copy **Redis URL** (TLS):
   ```
   rediss://default:AXXX...@us1-xxxxx.upstash.io:6379
   ```
3. Save as `REDIS_URL`

**Verify:** Upstash dashboard shows database active.

---

## Phase 3 — Cloudinary

1. Dashboard → copy **Cloud name**, **API Key**, **API Secret**
2. Save as:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

**Verify:** Upload test image in Cloudinary Media Library.

> Render ephemeral disk cannot persist uploads — Cloudinary is required for demo image posting.

---

## Phase 4 — Render (API)

### Option A — Blueprint (recommended)

1. Render Dashboard → **New** → **Blueprint**
2. Connect repo → select `render.yaml`
3. Set secret env vars when prompted (see table below)
4. Deploy

### Option B — Manual Web Service

| Setting | Value |
|---------|-------|
| Root Directory | `server` |
| Runtime | Node |
| Build Command | `npm ci` |
| Start Command | `node index.js` |
| Health Check Path | `/api/health/ready` |
| Instance type | Starter (WebSocket support) |

### Render environment variables

Copy from `server/.env.production.example` and fill in:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Atlas connection string |
| `JWT_SECRET` | `openssl rand -base64 48` |
| `CLIENT_URL` | `https://YOUR-APP.vercel.app` (set after Vercel deploy) |
| `APP_URL` | same as `CLIENT_URL` |
| `OPENAI_API_KEY` | `sk-...` |
| `CLOUDINARY_*` | all three from Cloudinary |
| `REDIS_URL` | Upstash URL |
| `HF_API_KEY` | optional |
| `AI_MATCHING_MODE` | `hybrid` |

**First deploy:** use placeholder `CLIENT_URL=https://placeholder.vercel.app`, then update after Vercel.

### Verify Render

```bash
API=https://findora-api.onrender.com   # your Render URL
curl -s "$API/api/health/ready" | jq .
```

Expected: `"ok": true`, mongo up, redis up, cloudinary up.

Run env verification locally with same values:

```bash
cd server
NODE_ENV=production npm run verify:env -- --deep
```

---

## Phase 5 — Vercel (Frontend)

1. Vercel → **Add New Project** → import GitHub repo
2. Settings:

| Setting | Value |
|---------|-------|
| Root Directory | `client` |
| Framework | Vite (auto-detected via `vercel.json`) |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm ci --legacy-peer-deps` |

3. **Environment Variables** (Production):

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://findora-api.onrender.com` |

4. Deploy → note production URL, e.g. `https://findora.vercel.app`

---

## Phase 6 — Link CORS & Socket.IO

1. Render → **findora-api** → Environment
2. Update:
   ```
   CLIENT_URL=https://findora.vercel.app
   APP_URL=https://findora.vercel.app
   ```
3. **Manual Deploy** → Redeploy API

This enables CORS and Socket.IO for your Vercel origin.

See [CORS_AND_SOCKETIO.md](./CORS_AND_SOCKETIO.md).

---

## Phase 7 — Seed demo data (optional)

From your machine (with Atlas URI):

```bash
cd server
MONGODB_URI="mongodb+srv://..." JWT_SECRET="..." OPENAI_API_KEY="..." \
  node scripts/seed.js
```

Creates sample users/items for demo walkthrough.

---

## Phase 8 — Post-deployment verification

Run the full checklist: [POST_DEPLOYMENT_VERIFICATION.md](./POST_DEPLOYMENT_VERIFICATION.md)

**Minimum demo path:**

1. Open Vercel URL
2. Register → login
3. Post lost item with photo
4. Post similar found item (second account or seed data)
5. Check **Matches** for AI match
6. Open **Chat** — confirm WebSocket in DevTools
7. Show **Map** view

---

## Demo script (5 minutes)

| Step | Action | Talking point |
|------|--------|---------------|
| 1 | Show home page | Modern lost & found platform |
| 2 | Register / login | JWT auth, secure sessions |
| 3 | Post item + photo | Cloudinary upload, geo tagging |
| 4 | Show match notification | OpenAI hybrid matching (text + image + location) |
| 5 | Open chat | Real-time Socket.IO on Render |
| 6 | Admin analytics (if admin user) | Operational dashboard |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| API 503 on health | Check Atlas IP allowlist + `MONGODB_URI` |
| CORS error | `CLIENT_URL` must exactly match Vercel URL |
| Socket fails | `VITE_API_URL` → Render; redeploy Vercel |
| Images don't upload | Set all 3 Cloudinary vars |
| No AI matches | Set `OPENAI_API_KEY`; wait for embeddings |
| Render cold start | First request slow (~30s); mention in demo |
| 401 on Socket | Login first; token in localStorage |

---

## Cost estimate (demo)

| Service | Tier | Cost |
|---------|------|------|
| Vercel | Hobby | Free |
| Render | Starter | ~$7/mo |
| MongoDB Atlas | M0 | Free |
| Upstash | Free tier | Free |
| Cloudinary | Free tier | Free |
| OpenAI | Pay-as-you-go | ~$1–5 for demo |

---

## Related docs

- [ENV_VARIABLES.md](./ENV_VARIABLES.md) — full env reference
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) — pre-deploy checklist
- [ROLLBACK_PLAN.md](./ROLLBACK_PLAN.md) — if demo deploy fails
- [DOCKER_VERIFICATION.md](./DOCKER_VERIFICATION.md) — local Docker testing

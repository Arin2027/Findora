# Environment Variables Reference

Complete reference for Findora production deployment. Validation is enforced by `server/config/env.js` (Zod) at API startup.

Run local verification:

```bash
cd server
cp .env.production.example .env   # fill in real values
NODE_ENV=production npm run verify:env
NODE_ENV=production npm run verify:env -- --deep
```

---

## MongoDB Atlas

| Variable | Required | Example |
|----------|----------|---------|
| `MONGODB_URI` | **Yes** | `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/findora?retryWrites=true&w=majority` |

**Atlas setup:**
1. Create free M0 cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Database Access → create user with `readWrite` on `findora`
3. Network Access → allow Render egress (or `0.0.0.0/0` for demos only)
4. Connect → Drivers → copy connection string, replace password

**Health check:** `/api/health/ready` → `services.mongo.status: "up"`

---

## JWT

| Variable | Required | Production rule |
|----------|----------|-----------------|
| `JWT_SECRET` | **Yes** | Min 32 chars; must not be example default |
| `JWT_EXPIRES_IN` | No | Default `15m` |
| `JWT_REFRESH_EXPIRES_IN` | No | Default `7d` |

Generate secret:

```bash
openssl rand -base64 48
```

Used by: REST auth middleware, Socket.IO handshake JWT verification.

---

## OpenAI

| Variable | Required | Notes |
|----------|----------|-------|
| `OPENAI_API_KEY` | **Yes** in prod when `AI_MATCHING_MODE` is `semantic` or `hybrid` | `sk-...` |
| `EMBEDDING_MODEL` | No | Default `text-embedding-3-small` |
| `AI_MATCHING_MODE` | No | `hybrid` (recommended), `semantic`, or `legacy` |

**Health check:** `/api/health/ready` → `services.openai.status: "up"` or `"skipped"` if legacy mode

---

## Hugging Face

| Variable | Required | Notes |
|----------|----------|-------|
| `HF_API_KEY` | Optional | Enables CLIP image matching |
| `HF_CLIP_MODEL` | No | Default `openai/clip-vit-base-patch32` |
| `ENABLE_IMAGE_MATCHING` | No | Default `true` |

If unset, matching falls back to text + location scores only.

**Health check:** `/api/health/ready` → `services.huggingface.status`

---

## Cloudinary

| Variable | Required | Notes |
|----------|----------|-------|
| `CLOUDINARY_CLOUD_NAME` | All 3 together | From Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | All 3 together | |
| `CLOUDINARY_API_SECRET` | All 3 together | |

**Rule:** Set all three or leave all empty. Partial config fails startup validation.

If disabled, uploads use local disk (`UPLOAD_DIR`) — not suitable for Render (ephemeral disk).

**Health check:** `/api/health/ready` → `services.cloudinary.status: "up"`

---

## Redis (Upstash)

| Variable | Required | Notes |
|----------|----------|-------|
| `REDIS_URL` | Optional | Upstash provides `rediss://` URL |

**Upstash setup:**
1. [console.upstash.com](https://console.upstash.com) → Create database
2. Copy **Redis URL** (TLS enabled)
3. Paste as `REDIS_URL` in Render

If unset, cache layer is skipped; app still runs.

**Health check:** `/api/health/ready` → `services.redis.status: "up"` or `"disabled"`

---

## CORS & frontend URL

| Variable | Required | Notes |
|----------|----------|-------|
| `CLIENT_URL` | **Yes** | Exact Vercel production URL |
| `APP_URL` | Recommended | Used in email links |

| Client variable | Required | Notes |
|-----------------|----------|-------|
| `VITE_API_URL` | **Yes** (prod) | Exact Render API URL |

**Critical pairing:**

```
CLIENT_URL=https://your-app.vercel.app     ← server (CORS + Socket.IO)
VITE_API_URL=https://your-api.onrender.com ← client (API + WebSocket)
```

---

## Email (optional)

| Variable | Notes |
|----------|-------|
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Required for verify-email and forgot-password emails |

---

## Quick matrix

| Service | Vars | Required in demo? |
|---------|------|-------------------|
| MongoDB Atlas | `MONGODB_URI` | Yes |
| JWT | `JWT_SECRET` | Yes |
| OpenAI | `OPENAI_API_KEY` | Yes (hybrid mode) |
| Hugging Face | `HF_API_KEY` | Optional |
| Cloudinary | `CLOUDINARY_*` × 3 | Recommended |
| Redis / Upstash | `REDIS_URL` | Optional |
| Vercel client | `VITE_API_URL` | Yes |
| CORS / Socket | `CLIENT_URL` | Yes |

# Findora Production Deployment Checklist

Use before every live deployment. For step-by-step demo setup see [DEMO_DEPLOYMENT_GUIDE.md](./DEMO_DEPLOYMENT_GUIDE.md).

---

## Pre-deploy — code & CI

- [ ] All CI jobs pass (`server-test`, `client-test`, `client-build`, `docker-build`)
- [ ] `cd client && VITE_API_URL=https://your-api.onrender.com npm run build` succeeds
- [ ] Git tagged (`git tag v1.x.x-demo`)

---

## Pre-deploy — environment verification

Run locally with production values:

```bash
cd server
NODE_ENV=production npm run verify:env
NODE_ENV=production npm run verify:env -- --deep
```

### MongoDB Atlas

- [ ] `MONGODB_URI` set (Atlas SRV connection string)
- [ ] Database user has `readWrite` on `findora`
- [ ] Network Access allows Render egress (or demo: `0.0.0.0/0`)
- [ ] Atlas backup/snapshot taken (if schema changed)

### JWT

- [ ] `JWT_SECRET` ≥ 32 characters
- [ ] Not using example default from `.env.example`
- [ ] Secret backed up securely (password manager)

### OpenAI

- [ ] `OPENAI_API_KEY` set (required for `hybrid` / `semantic` mode)
- [ ] Billing enabled on OpenAI account
- [ ] `AI_MATCHING_MODE=hybrid` (recommended for demo)

### Hugging Face (optional)

- [ ] `HF_API_KEY` set if demoing image matching
- [ ] Or `ENABLE_IMAGE_MATCHING=false` to skip

### Cloudinary

- [ ] All three set: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- [ ] Or all three empty (not recommended on Render)

### Redis / Upstash

- [ ] `REDIS_URL` set to Upstash `rediss://` URL
- [ ] Or omitted (cache disabled)

### CORS & client pairing

- [ ] `CLIENT_URL` = exact Vercel production URL (HTTPS, no trailing slash)
- [ ] `VITE_API_URL` = exact Render API URL (HTTPS, no trailing slash)
- [ ] `APP_URL` set for email links

Templates: `server/.env.production.example`, `client/.env.production.example`

---

## Deploy — platform configs

### Render (backend)

- [ ] `render.yaml` blueprint deployed OR manual Web Service configured
- [ ] Root directory: `server`
- [ ] Start: `node index.js`
- [ ] Health check: `/api/health/ready`
- [ ] All env vars from `server/.env.production.example` set
- [ ] Web Service plan supports WebSockets (not worker/cron)

### Vercel (frontend)

- [ ] Root directory: `client`
- [ ] `vercel.json` present (SPA rewrites)
- [ ] `VITE_API_URL` set for Production environment
- [ ] Redeploy after env changes

### MongoDB Atlas

- [ ] Cluster in same region as Render (latency)
- [ ] Connection string tested

### Upstash

- [ ] Redis database created
- [ ] URL pasted into Render `REDIS_URL`

---

## Pre-deploy — infrastructure

- [ ] HTTPS on both Vercel and Render (default)
- [ ] Render `trust proxy` active (built into app for production)
- [ ] Docker stack tested locally (optional): [DOCKER_VERIFICATION.md](./DOCKER_VERIFICATION.md)

---

## Deploy order

1. [ ] MongoDB Atlas ready
2. [ ] Upstash + Cloudinary credentials ready
3. [ ] Deploy **Render API** (placeholder `CLIENT_URL` OK for first pass)
4. [ ] Verify `GET /api/health/ready` → 200
5. [ ] Deploy **Vercel frontend** with `VITE_API_URL`
6. [ ] Update Render `CLIENT_URL` to Vercel URL → redeploy API
7. [ ] Run [POST_DEPLOYMENT_VERIFICATION.md](./POST_DEPLOYMENT_VERIFICATION.md)

---

## Post-deploy smoke tests

- [ ] Register / login / logout
- [ ] CORS preflight from Vercel origin passes
- [ ] Socket.IO WebSocket to Render (DevTools → Network → WS)
- [ ] Post item with Cloudinary image
- [ ] AI match appears (two similar items)
- [ ] Chat realtime works
- [ ] Map loads

---

## Rollback readiness

- [ ] Previous Render deploy available for rollback
- [ ] Previous Vercel deployment available to promote
- [ ] Env var backup saved before changes
- [ ] [ROLLBACK_PLAN.md](./ROLLBACK_PLAN.md) reviewed

---

## Monitoring (recommended)

- [ ] Alert on `/api/health/ready` 503
- [ ] Render log stream accessible
- [ ] Atlas alerts for connections / storage

---

## Sign-off

| Role | Name | Date | Pass |
|------|------|------|------|
| Deployer | | | ☐ |
| Demo lead | | | ☐ |

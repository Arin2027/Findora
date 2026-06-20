# Rollback Plan

Use this plan if a production deployment causes outages or critical regressions.

---

## Rollback triggers

- `/api/health/ready` returns 503 for > 5 minutes after deploy
- Login or registration failure rate spikes
- Socket.IO connections fail for all users
- Data corruption or failed migrations
- Cloudinary / OpenAI integration broken for all uploads/matches

---

## Rollback matrix

| Component | Platform | Rollback method | Typical time |
|-----------|----------|-----------------|--------------|
| Frontend | Vercel | Promote previous deployment | 1–2 min |
| API | Render | Rollback to previous deploy | 2–5 min |
| Database | MongoDB Atlas | Restore snapshot | 10–30 min |
| Redis | Upstash | No rollback needed (cache only) | — |
| Media | Cloudinary | Assets persist; no rollback | — |
| Secrets | Render/Vercel | Revert env var + redeploy | 5 min |

---

## Step 1 — Frontend rollback (Vercel)

1. Vercel Dashboard → Project → **Deployments**
2. Find last known-good deployment
3. Click **⋯** → **Promote to Production**
4. Verify `VITE_API_URL` unchanged (or revert if changed)

**Verify:** Home page loads, login works, no console CORS errors.

---

## Step 2 — API rollback (Render)

1. Render Dashboard → **findora-api** → **Events**
2. Select previous successful deploy → **Rollback**
3. Confirm env vars match previous release

**Verify:**

```bash
curl -s https://your-api.onrender.com/api/health/ready | jq .ok
# true
```

---

## Step 3 — Environment rollback

If the incident was caused by env changes:

1. Render → Environment → restore previous values (keep a copy before each deploy)
2. Vercel → Environment Variables → restore `VITE_API_URL`
3. **Redeploy** both services after reverting

Critical vars to preserve backups of:

- `MONGODB_URI`
- `JWT_SECRET` (reverting invalidates active tokens if changed)
- `CLIENT_URL` / `VITE_API_URL`
- `OPENAI_API_KEY`, `CLOUDINARY_*`, `REDIS_URL`

> **Warning:** Changing `JWT_SECRET` logs out all users.

---

## Step 4 — Database rollback (Atlas)

Only if schema/data was corrupted:

1. Atlas → Cluster → **Backup** → select snapshot before deploy
2. Restore to new cluster or point-in-time recovery
3. Update `MONGODB_URI` in Render if cluster URL changed
4. Redeploy API

**Pre-deploy habit:** note Atlas backup schedule; take manual snapshot before schema changes.

---

## Step 5 — Communication

1. Confirm health endpoints green
2. Run [POST_DEPLOYMENT_VERIFICATION.md](./POST_DEPLOYMENT_VERIFICATION.md) checklist
3. Notify stakeholders demo/production is restored

---

## Prevention

- [ ] Tag git release before each deploy (`v1.0.0-demo`)
- [ ] Export Render env vars before changes
- [ ] Screenshot Vercel env vars before changes
- [ ] Run `npm run verify:env -- --deep` against staging before prod
- [ ] Keep previous Vercel deployment unpurged (Vercel retains by default)

---

## Emergency contacts / resources

| Resource | URL |
|----------|-----|
| Vercel status | https://www.vercel-status.com |
| Render status | https://status.render.com |
| MongoDB Atlas status | https://status.mongodb.com |
| Upstash status | https://status.upstash.com |

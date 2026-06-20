# Post-Deployment Verification Checklist

Run immediately after deploying to Vercel + Render. Estimated time: **15 minutes**.

Replace placeholders:

```
CLIENT=https://your-app.vercel.app
API=https://your-api.onrender.com
```

---

## 1. Infrastructure health

- [ ] **API liveness**
  ```bash
  curl -s "$API/api/health/live"
  # {"ok":true,"status":"alive"}
  ```

- [ ] **API readiness**
  ```bash
  curl -s "$API/api/health/ready" | jq .
  # ok: true, services.mongo.status: "up"
  ```

- [ ] **MongoDB Atlas** — `services.mongo.status` = `"up"`
- [ ] **Redis / Upstash** — `services.redis.status` = `"up"` or `"disabled"`
- [ ] **Cloudinary** — `services.cloudinary.status` = `"up"` (if configured)
- [ ] **OpenAI** — `services.openai.status` = `"up"` (hybrid/semantic mode)
- [ ] **Hugging Face** — `services.huggingface.status` = `"up"` or `"disabled"`

---

## 2. CORS verification

- [ ] Preflight succeeds from Vercel origin
  ```bash
  curl -s -I -X OPTIONS "$API/api/auth/login" \
    -H "Origin: $CLIENT" \
    -H "Access-Control-Request-Method: POST" | grep -i access-control
  ```

- [ ] `Access-Control-Allow-Origin` equals `$CLIENT` exactly

See [CORS_AND_SOCKETIO.md](./CORS_AND_SOCKETIO.md) for details.

---

## 3. Frontend (Vercel)

- [ ] `$CLIENT` loads without blank screen
- [ ] No `VITE_API_URL` warning in browser console (production build)
- [ ] Static assets load (check Network tab — `/assets/*` 200)
- [ ] Dark/light theme toggle works

---

## 4. Authentication

- [ ] Register new account
- [ ] Login with existing account
- [ ] `/api/auth/me` returns user (check Network tab after login)
- [ ] Logout clears session
- [ ] Protected routes redirect to login when logged out

---

## 5. Socket.IO (critical)

- [ ] Log in on `$CLIENT`
- [ ] DevTools → Network → **WS** shows connection to `$API/socket.io/`
- [ ] WebSocket status **101**
- [ ] No repeated `[socket] connection error` in console
- [ ] Open **Chat** — page loads without error
- [ ] (With two users) typing indicator or message delivery works

---

## 6. Core features

- [ ] **Post item** — create lost/found item with image
- [ ] Image appears (Cloudinary URL or upload path)
- [ ] **Dashboard** — lists user's items
- [ ] **Matches** — page loads; AI match may appear after second similar item
- [ ] **Map** — loads map tiles and markers
- [ ] **Notifications** — bell icon / unread count loads
- [ ] **Admin** — accessible only for admin role

---

## 7. API error format

- [ ] Trigger 404: `curl -s "$API/api/nonexistent" | jq .success` → `false`
- [ ] Error body includes `error` and `message` fields

---

## 8. Performance spot-check

- [ ] Home page First Contentful Paint acceptable on 4G throttling
- [ ] API `/api/items` responds in < 2s (cold start may be slower on Render free tier)

---

## 9. Security spot-check

- [ ] API only serves HTTPS (Render default)
- [ ] Vercel only serves HTTPS
- [ ] JWT not exposed in URLs
- [ ] Admin routes return 403 for non-admin users

---

## 10. Demo-ready sign-off

| Check | Pass |
|-------|------|
| Health ready 200 | ☐ |
| CORS OK | ☐ |
| Socket.IO connected | ☐ |
| Login + post item | ☐ |
| Match or chat demo path works | ☐ |

**Signed off by:** _______________ **Date:** _______________

---

## If any check fails

1. Note failing step and error message
2. Check [ROLLBACK_PLAN.md](./ROLLBACK_PLAN.md)
3. Compare env vars against [ENV_VARIABLES.md](./ENV_VARIABLES.md)
4. Roll back Render/Vercel to last good deployment if unresolved in 30 min

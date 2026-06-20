# CORS & Socket.IO — Production Verification

Findora uses a split deployment: **Vercel (static frontend)** + **Render (API + WebSocket)**.

---

## CORS configuration (verified)

**Server:** `server/app.js`

```javascript
cors({
  origin: env.CLIENT_URL,  // single allowed origin
  credentials: true,
})
```

**Socket.IO:** `server/sockets/index.js`

```javascript
cors: { origin: CLIENT_URL, credentials: true }
```

### Requirements

| Setting | Value |
|---------|-------|
| `CLIENT_URL` | Exact Vercel production URL, e.g. `https://findora.vercel.app` |
| Protocol | Must include `https://` |
| Trailing slash | **No** trailing slash |
| Preview deploys | Vercel preview URLs are **not** allowed unless you change `CLIENT_URL` |

### Verify CORS manually

```bash
API=https://your-api.onrender.com
CLIENT=https://your-app.vercel.app

curl -s -o /dev/null -w "%{http_code}" \
  -H "Origin: $CLIENT" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS "$API/api/auth/login"
# Expected: 204 or 200 with Access-Control-Allow-Origin: $CLIENT
```

```bash
curl -s -I -H "Origin: $CLIENT" "$API/api/health/live" | grep -i access-control
# Expected: Access-Control-Allow-Origin: https://your-app.vercel.app
```

### Common CORS failures

| Symptom | Fix |
|---------|-----|
| `CORS blocked` in browser | `CLIENT_URL` does not exactly match browser origin |
| Works on `www` but not apex | Pick one domain; set `CLIENT_URL` to match |
| Vercel preview broken | Expected — update `CLIENT_URL` or use production URL for demo |

---

## Socket.IO configuration (verified)

**Client:** `client/src/socket.js`

- Connects to `VITE_API_URL` (not Vercel origin)
- Sends JWT via `auth: { token }`
- Transports: `websocket`, `polling` (fallback)
- Reconnects after login via `reconnectSocket()`

**Server:** attached to same HTTP server as Express (`server/index.js`)

### Requirements

| Platform | Requirement |
|----------|-------------|
| Render | Web Service (not Background Worker); HTTP + WebSocket on same port |
| Vercel | Static only — **does not** host Socket.IO |
| `VITE_API_URL` | Must be Render API URL |
| `CLIENT_URL` | Must be Vercel URL (Socket.IO CORS) |

### Verify Socket.IO after deploy

1. Log in on the Vercel site
2. Open DevTools → **Network** → filter **WS**
3. Confirm WebSocket to `wss://your-api.onrender.com/socket.io/...`
4. Status should be **101 Switching Protocols**
5. Open **Chat** or **Dashboard** — realtime notifications should arrive

### Browser console check

After login, no repeated `[socket] connection error` warnings.

### Manual socket test (optional)

```bash
npm install -g wscat  # or use browser DevTools
# Login via API first to get token, then connect with socket.io-client test page
```

### Common Socket.IO failures

| Symptom | Fix |
|---------|-----|
| WS connects to Vercel URL | Set `VITE_API_URL` in Vercel env; redeploy client |
| `Unauthorized` on connect | User not logged in; token missing/expired |
| CORS error on WS | Fix `CLIENT_URL` on Render |
| Frequent disconnects on Render free tier | Cold starts; upgrade plan or use keep-alive ping |
| 502 on WebSocket | Render service not running; check `/api/health/ready` |

---

## Deployment pairing checklist

- [ ] `CLIENT_URL` = Vercel production URL
- [ ] `VITE_API_URL` = Render API URL
- [ ] Both use HTTPS
- [ ] Render health check path = `/api/health/ready`
- [ ] Login works from Vercel origin (CORS OK)
- [ ] WebSocket connects to Render (not Vercel)

See [POST_DEPLOYMENT_VERIFICATION.md](./POST_DEPLOYMENT_VERIFICATION.md) for full smoke tests.

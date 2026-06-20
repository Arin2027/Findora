# Findora Architecture

## Overview

Findora is a full-stack AI-powered lost & found platform:

- **Frontend:** React 18 + Vite + Tailwind + Framer Motion + Zustand
- **Backend:** Node.js + Express (layered modules)
- **Database:** MongoDB + Mongoose
- **Realtime:** Socket.IO (user rooms + conversation rooms)
- **AI:** OpenAI embeddings (text) + HuggingFace CLIP (image) + geo similarity

## Backend layers

```
HTTP Request
  → middleware (auth, rate limit, sanitize, logging)
  → routes (modules/*/routes)
  → controller (thin)
  → service (business logic)
  → repository / models (data)
```

## AI matching pipeline

1. On item create: generate `textEmbedding` (OpenAI), optional `imageEmbedding` (CLIP).
2. Load up to 200 opposite-type open items.
3. Score: `0.4 × text + 0.4 × image + 0.2 × location` (reweighted if image missing).
4. If semantic mode fails → **legacy TF-IDF fallback** (`AI_MATCHING_MODE=hybrid`).
5. Persist `Match` + realtime notifications via Socket.IO.

## Module map

| Module | Path |
|--------|------|
| Auth | `server/modules/auth/` |
| Items | `server/modules/items/` |
| Matches | `server/modules/matches/` |
| Chat | `server/modules/chat/` |
| Notifications | `server/modules/notifications/` |
| Admin | `server/modules/admin/` |
| Geo | `server/modules/geo/` |
| AI | `server/services/ai/` |
| Sockets | `server/sockets/` |

## Frontend structure

- `services/` — API clients
- `stores/` — theme, notifications
- `hooks/` — useAuth, useSocket
- `components/ui/` — design system
- `layouts/` — AppLayout with sidebar

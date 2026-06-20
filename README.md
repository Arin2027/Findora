# Findora

**AI-powered Lost & Found platform** — startup-grade final year project with semantic matching, image similarity, maps, realtime chat, and enterprise admin analytics.

## Features

- OpenAI **semantic embeddings** + legacy TF-IDF fallback
- **CLIP** image matching via HuggingFace (40/40/20 text/image/location scoring)
- **Leaflet** maps, nearby search, geocoding
- **Socket.IO** live notifications, typing indicators, read receipts
- Email verification, password reset, JWT refresh
- **Admin dashboard** with Recharts analytics & export
- Cloudinary uploads, Redis caching, Docker & CI/CD

## Tech stack

| Layer | Technologies |
|-------|----------------|
| Frontend | React 18, Vite, Tailwind, Framer Motion, Zustand, Recharts, React Leaflet |
| Backend | Node.js, Express, Mongoose, Socket.IO, Zod env validation |
| AI | OpenAI `text-embedding-3-small`, HuggingFace CLIP |
| DevOps | Docker, GitHub Actions, Jest, Vitest, Cypress |

## Quick start

```bash
npm run install:all
cp server/.env.example server/.env   # set MONGODB_URI, JWT_SECRET
cp client/.env.example client/.env   # optional
npm run seed
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:5001 — `GET /api/health`

**Seed accounts:**

- Admin: `admin@findora.local` / `Admin12345`
- Users: `alice@findora.local`, `bob@findora.local` / `User12345`

## Project structure

```
server/
  modules/     # auth, items, matches, chat, notifications, admin, geo
  services/ai/ # embedding, CLIP, matching orchestrator
  sockets/     # Socket.IO handlers
client/
  src/
    components/ui/, layouts/, pages/, services/, stores/, hooks/
docs/          # ARCHITECTURE, API, VIVA, DEPLOYMENT, etc.
docker/        # Dockerfile + compose
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [API](docs/API.md)
- [Database](docs/DATABASE.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Viva Q&A](docs/VIVA.md)
- [Presentation](docs/PRESENTATION.md)
- [Resume bullets](docs/RESUME.md)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | API + Vite |
| `npm run seed` | Reset demo data |
| `npm run backfill:embeddings --prefix server` | Backfill OpenAI vectors |
| `npm test --prefix server` | Jest unit tests |
| `npm test --prefix client` | Vitest |
| `docker compose -f docker/docker-compose.yml up` | Local stack |

## Environment highlights

See `server/.env.example` for `OPENAI_API_KEY`, `HF_API_KEY`, `AI_MATCHING_MODE` (`hybrid`|`semantic`|`legacy`), Cloudinary, Redis, SMTP.

## License

Educational / FYP use.

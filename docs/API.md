# Findora API Reference

Base URL: `http://localhost:5001` (or `VITE_API_URL`)

## Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register `{ email, password }` |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user (Bearer) |
| POST | `/api/auth/refresh` | `{ refreshToken }` |
| POST | `/api/auth/verify-email` | `{ token }` |
| POST | `/api/auth/forgot-password` | `{ email }` |
| POST | `/api/auth/reset-password` | `{ token?, otp?, password }` |

## Items

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/items` | List with filters |
| GET | `/api/items/nearby` | `?lat=&lng=&radiusKm=` |
| GET | `/api/items/mine` | User items (auth) |
| GET | `/api/items/:id` | Detail |
| POST | `/api/items` | Multipart create (auth) |
| PATCH | `/api/items/:id` | Update (auth) |
| DELETE | `/api/items/:id` | Delete (auth) |

## Matches, Chat, Notifications

See README and `server/modules/*/routes.js`.

## Admin analytics

| GET | `/api/admin/analytics/overview` |
| GET | `/api/admin/analytics/categories` |
| GET | `/api/admin/analytics/export` |

## Geo

| GET | `/api/geo/search?q=` | Nominatim autocomplete |

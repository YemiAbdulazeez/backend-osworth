# Osworth API — Render

Docker web service. Blueprint: [render.yaml](./render.yaml).

## One-time setup

1. Create a MySQL 8 database (Azure Database for MySQL, Aiven, PlanetScale MySQL mode, or any managed MySQL). Render does not host MySQL natively.
2. Create a Render Web Service from this repo (Docker). Or apply `render.yaml`.
3. Set env vars (see `.env.example`). Required production values:

| Variable | Example |
|----------|---------|
| `APP_URL` | `https://<your-app>.azurestaticapps.net` |
| `CORS_ORIGINS` | same Azure origin (add preview origins if needed) |
| `DATABASE_URL` | `mysql://user:pass@host:3306/osworth` |
| `COOKIE_SECURE` | `true` |
| `COOKIE_SAMESITE` | `none` |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | long random strings |
| `SEED_SUPER_ADMIN_EMAIL` / `SEED_SUPER_ADMIN_PASSWORD` | change from local demo |
| `RESEND_API_KEY`, `EMAIL_FROM`, `OPS_EMAIL` | for mail |
| `CLOUDINARY_*` | for CMS image uploads |

4. First boot runs `db:migrate` then `db:seed` (insert-ignore), then starts the API.
5. Health check: `GET /api/v1/health`

Cross-site cookies (Azure frontend → Render API) need `COOKIE_SECURE=true` and `COOKIE_SAMESITE=none`.

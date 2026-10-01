# Osworth API — Render

Docker web service. Blueprint: [render.yaml](./render.yaml).

## What the deploy log error means

```
Error: getaddrinfo ENOTFOUND osworth-remsana-aibo.g.aivencloud.com
```

`DATABASE_URL` points at a MySQL hostname that **does not exist in DNS** (deleted Aiven service, typo, or stale URI). The image builds fine; boot fails at migrate because MySQL is unreachable.

**Fix:** create (or restore) a MySQL 8 database, copy a fresh connection URI, and set `DATABASE_URL` on the Render service. Then redeploy.

Managed MySQL (Aiven, Azure, etc.) usually needs TLS:

```text
mysql://USER:PASSWORD@HOST:PORT/DATABASE?ssl-mode=REQUIRED
```

If migrate fails with `self-signed certificate in certificate chain`, keep TLS on but allow the provider CA (default in this app). Only set `MYSQL_SSL_REJECT_UNAUTHORIZED=true` plus `MYSQL_SSL_CA` (Aiven CA PEM) if you want full verification.

Also ensure Render `NODE_ENV=production` (not `development`).
Aiven often fails with `self-signed certificate in certificate chain` if Node verifies the chain strictly. This API defaults to TLS **with** `rejectUnauthorized: false` for `ssl-mode=REQUIRED`. To pin Aiven’s CA instead, set:

| Variable | Value |
|----------|--------|
| `MYSQL_SSL_REJECT_UNAUTHORIZED` | `true` |
| `MYSQL_SSL_CA` | full PEM text of Aiven `ca.pem` |

Also set Render `NODE_ENV=production` (logs showing `NODE_ENV=development` mean that env var is wrong on the service).

## One-time setup

1. Create a MySQL 8 database (Aiven, Azure Database for MySQL, Railway, or any managed MySQL). Render does not host MySQL.
2. Create a Render Web Service from this repo (Docker), or apply `render.yaml`.
3. Set env vars (see `.env.example`). Required production values:

| Variable | Example |
|----------|---------|
| `APP_URL` | `https://your-app.vercel.app` (frontend origin) |
| `CORS_ORIGINS` | same Vercel origin (comma-separate preview URLs if needed) |
| `DATABASE_URL` | `mysql://user:pass@host:3306/osworth?ssl-mode=REQUIRED` |
| `COOKIE_SECURE` | `true` |
| `COOKIE_SAMESITE` | `none` |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | long random strings (Render can generate) |
| `SEED_SUPER_ADMIN_EMAIL` / `SEED_SUPER_ADMIN_PASSWORD` | change from local demo |
| `RESEND_API_KEY`, `EMAIL_FROM`, `OPS_EMAIL` | for mail |
| `CLOUDINARY_*` | for CMS image uploads |

4. First boot runs `db:migrate` → `db:seed` (insert-ignore) → API (`scripts/render-start.sh`).
5. Health check: `GET /api/v1/health` → `{ "ok": true, "db": "up" }`.

Cross-site cookies (Vercel frontend → Render API) need `COOKIE_SECURE=true` and `COOKIE_SAMESITE=none`.

Do **not** override the Docker start command to `node dist/index.js` alone — that skips migrations. Leave the Dockerfile `CMD` as `sh scripts/render-start.sh`.

## Local

```sh
cp .env.example .env
docker compose up -d
npm ci
npm run db:migrate && npm run db:seed
npm run dev
```

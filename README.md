# Osworth API

Node.js API for the Osworth public site and admin CMS. Playbook: [BACKEND.md](./BACKEND.md). Deploy: [DEPLOY.md](./DEPLOY.md).

## Run locally

1. Copy `.env.example` to `.env`.
2. Start MySQL: `docker compose up -d`
3. `npm install`
4. `npm run db:migrate`
5. `npm run db:seed`
6. `npm run db:verify`
7. `npm run dev` — API at `http://localhost:4000`
8. `npm test`

Local demo login after seed: `admin@osworth.local` / `osworth2027`. Change both before any shared deployment.

Health check: `GET /api/v1/health`

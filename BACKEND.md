# Osworth Backend Build Guide

This file is the implementation contract for the Osworth API. It is written so an AI can follow it without guessing.

Repo: `MR SEUN/backend-osworth`  
Sibling site: `MR SEUN/osworth-health-hub`  
Stack: Node.js 20, TypeScript, Express, MySQL 8, Resend, Cloudinary.

## Rules for the implementing AI

1. Read the status table before editing code. A row with ✅ is already implemented and wired. Do not rebuild it. Run that row's verify command. Continue only if a later row has no ✅.
2. Finish one phase end to end before starting the next. End to end means: route, validation, service, MySQL, and the JSON shape in this file all work together. A phase is not done because a file exists.
3. After a phase or a fix really works, add ✅ to its heading and to the status table. Do not add ✅ for work that only compiles.
4. Keep JSON field names exactly as written here. The public site and admin CMS already use these names.
5. Do not delete audit rows. `DELETE /api/v1/admin/audit` must stay `405`.
6. Do not store or log plaintext passwords. The one exception is the create-admin response, which returns `temporaryPassword` once to the signed-in super admin and emails it.
7. If email fails, keep the database row. Log the failure. Do not roll the order, contact, or newsletter write back.
8. Frontend cutover is Phase 10. Do not start it until Phases 1–9 still show ✅ and `npm test` passes.

## Status

| ID | Work | State |
|----|------|--------|
| FIX-1 | News JSON uses `date` and `image` | ✅ |
| FIX-2 | Audit JSON is camelCase | ✅ |
| FIX-3 | Staff profile and sessions are camelCase | ✅ |
| FIX-4 | Intake rows include `created_at` and `createdAt` | ✅ |
| FIX-5 | `item_count` is the sum of quantities | ✅ |
| FIX-6 | Order reference is `OSW-` plus 8 crypto characters | ✅ |
| FIX-7 | Login errors do not reveal the demo password | ✅ |
| FIX-8 | Create-admin returns `temporaryPassword` once and emails it | ✅ |
| FIX-9 | Logout accepts a bearer token or the refresh cookie | ✅ |
| FIX-10 | Password change revokes other sessions | ✅ |
| FIX-11 | Super admin and the current user cannot be deleted | ✅ |
| FIX-12 | Role matrix is enforced on every mutating route | ✅ |
| FIX-13 | Newsletter 409 text matches the site; unsubscribed emails can rejoin | ✅ |
| FIX-14 | Mail failure does not roll back the write | ✅ |
| FIX-15 | Seed images are honest about Vite assets vs HTTP URLs | ✅ |
| FIX-16 | Schema source of truth is raw SQL, not Drizzle | ✅ |
| FIX-17 | Audit delete is rejected with 405 | ✅ |
| FIX-18 | Unknown upload folders fall back to `osworth/misc` | ✅ |
| FIX-19 | Access JWT includes `sid` | ✅ |
| FIX-20 | Catalogue lists are raw arrays; audit is `{ data, nextCursor }` | ✅ |
| FIX-21 | Slugs are assigned on create and are not changed by a rename | ✅ |
| FIX-22 | Product `category` filter accepts a name or a slug | ✅ |
| FIX-23 | Seed uses `INSERT IGNORE` so a second run does not wipe edits | ✅ |
| Phase 1 | Scaffold, env, errors, health | ✅ |
| Phase 2 | MySQL schema, migrate, seed, verify | ✅ |
| Phase 3 | Auth, profile, sessions, invites | ✅ |
| Phase 4 | Public catalogue reads | ✅ |
| Phase 5 | Orders, contact, newsletter, Resend | ✅ |
| Phase 6 | Admin CRUD and audit | ✅ |
| Phase 7 | Cloudinary uploads | ✅ |
| Phase 8 | Analytics ingest and admin aggregates | ✅ |
| Phase 9 | Rate limits, helmet, logging, Dockerfile | ✅ |
| Phase 10 | Replace the site's localStorage CMS with this API | ✅ |

Verified on 23 Sep 2026 against MySQL 8.4 in Docker:

- `npx tsc -p tsconfig.json --noEmit` passed.
- Unit tests: 7 passed (`slugify`, order reference, token hash, TTL, order/contact/newsletter schemas).
- `npm run db:migrate` applied `001_init.sql`.
- `npm run db:seed` inserted 15 products, 11 categories, and 1 super admin.
- `npm run db:verify` passed, including a bcrypt check of the seed password.
- `src/app.e2e.test.ts` passed one full HTTP walk: health, products, category filter, news `date`/`image`, login, refresh cookie, dashboard, create/delete product, order mail log, order status patch, newsletter 201 then 409, page-view aggregate, admin invite login, audit list, audit delete 405, bad upload 400, image upload without Cloudinary 503, contact mail log, logout 204.

## What the API is for

The API replaces the browser demo in the health-hub app:

| Frontend file | Demo behaviour today | API that replaces it |
|---------------|----------------------|----------------------|
| `src/lib/content-store.ts` | Catalogue and settings in localStorage | Public GET and admin CRUD |
| `src/lib/cms.ts` | Orders, contact, newsletter, plus write stubs | `POST /orders`, `/contact`, `/newsletter` and admin CRUD |
| `src/lib/auth.tsx` | Staff login in localStorage | `/api/v1/auth/*` and `/api/v1/admin/profile` |
| `src/lib/audit.ts` | Plain-English audit in localStorage | `GET /api/v1/admin/audit` |
| `src/lib/analytics.ts` | Page and product counters in localStorage | `POST /api/v1/analytics/*` and admin analytics |

Stay in the browser. Do not build API tables for these keys:

- `osworth.cart.v1`
- `osworth.favorites.v1`
- `osworth.customer.v1`

Do not add payments or customer accounts. Do not add a password-reset flow in this build. That is a later product, not a current screen.

## Fixes

Each fix is a place where the first draft of this guide did not match the running site. The code now follows the decision, not the old draft.

### ✅ FIX-1 — News uses `date` and `image`

`src/lib/types.ts` `NewsItem` uses `date` and `image`. The MySQL columns stay `published_on` and `image_url`. Map them in `mapNews` inside `src/services/catalogue.service.ts`.

Write body accepts `date` and `image`. Example response:

```json
{
  "id": "00000000-0000-4000-a600-000000000001",
  "slug": "quality-healthcare-within-reach",
  "title": "Quality Healthcare Within Reach Across Nigeria",
  "excerpt": "...",
  "body": "...",
  "date": "2026-03-12",
  "category": "Company",
  "image": "https://images.unsplash.com/...",
  "status": "published",
  "created_at": "2026-09-23T05:54:00.000Z",
  "updated_at": "2026-09-23T05:54:00.000Z"
}
```

### ✅ FIX-2 — Audit matches `AuditEntry`

Return camelCase. Do not return `actor_user_id`.

```json
{
  "data": [
    {
      "id": "uuid",
      "summary": "Signed in to the dashboard",
      "actorName": "Osworth Super Admin",
      "actorEmail": "admin@osworth.local",
      "createdAt": "2026-09-23T05:55:00.000Z"
    }
  ],
  "nextCursor": null
}
```

Query: `user` (email), `from` (`YYYY-MM-DD`), `to` (`YYYY-MM-DD`), `limit` (default 200, max 500), `cursor`. `from` and `to` are inclusive calendar dates. Sort newest first. The cursor is base64url JSON `{ createdAt, id }` using the raw MySQL datetime string, not the ISO string, so the comparison matches the column.

### ✅ FIX-3 — Staff JSON matches `auth.tsx`

`PublicUser`:

```json
{
  "id": "uuid",
  "email": "admin@osworth.local",
  "name": "Osworth Super Admin",
  "phone": "+234 800 000 0000",
  "address": "Lagos, Nigeria",
  "avatarUrl": "",
  "role": "super_admin",
  "createdAt": "2026-09-23T05:54:00.000Z",
  "updatedAt": "2026-09-23T05:54:00.000Z"
}
```

Never include `password` or `password_hash`.

Session:

```json
{
  "id": "uuid",
  "userId": "uuid",
  "email": "admin@osworth.local",
  "createdAt": "2026-09-23T05:55:00.000Z",
  "lastActiveAt": "2026-09-23T05:55:00.000Z",
  "userAgent": "Mozilla/5.0 ...",
  "current": true
}
```

`current` is true when `session.id` equals the `sid` claim in the access token. List only rows with `revoked_at IS NULL`.

Profile patch accepts `avatarUrl` or `avatar_url`. Store `avatar_url`.

### ✅ FIX-4 — Intake timestamps

Order, message, and subscriber objects include both `created_at` and `createdAt` set to the same ISO instant. The admin order screen was built against localStorage `createdAt`. The database column is `created_at`.

### ✅ FIX-5 — `item_count`

`item_count` is the sum of `items[].quantity`. Two lines of quantity 2 and 3 produce `item_count` 5. The admin table shows `items.length` itself; still store the quantity sum because that is the useful stock number.

### ✅ FIX-6 — Reference format

Generate `OSW-` plus 8 characters from `A-Z` and `0-9` using `crypto.randomBytes`. Retry up to 5 times on a unique-key clash. Do not use `Math.random().toString(36)`.

### ✅ FIX-7 — Login error text

Wrong email or password returns `401`:

```json
{ "error": { "code": "INVALID_CREDENTIALS", "message": "Invalid email or password" } }
```

Do not include the demo password in that message. If the email does not exist, still run one bcrypt compare against a dummy hash so the timing is similar.

### ✅ FIX-8 — Invite password

`POST /api/v1/admin/users` response:

```json
{
  "user": { "id": "uuid", "email": "ada@example.com", "role": "admin" },
  "emailSent": false,
  "temporaryPassword": "Ow-abcdefghij"
}
```

The admin users screen shows `temporaryPassword`. Return it only on this create response. Also send the Resend invite. If `RESEND_API_KEY` is empty, `emailSent` is false and the log line contains the recipient and subject only, never the password. New accounts are always role `admin`. This route cannot create a `super_admin`.

### ✅ FIX-9 — Logout

`POST /api/v1/auth/logout` does not require a still-valid access token. Attach the staff user when the bearer token is valid. Otherwise resolve the session from the `osworth_refresh` cookie. Revoke that session, write “Signed out of the dashboard”, and clear the cookie. If neither credential works, return `401`.

### ✅ FIX-10 — Password change

`POST /api/v1/admin/profile/password` body is `{ "currentPassword", "newPassword" }`. `newPassword` minimum length is 8. Wrong current password is `400` with message `Current password is incorrect`. On success, hash with bcrypt cost 12, revoke every other session for that user, keep the current session, audit “Changed their account password”, then send the security email. Return `204`.

### ✅ FIX-11 — Protected accounts

`DELETE /api/v1/admin/users/:id` returns `403` with `The super admin account cannot be removed` when the target role is `super_admin`. It returns `403` with `You cannot remove your own account` when the id is the caller. Otherwise revoke that user's sessions and delete the user in the same transaction as the audit row.

### ✅ FIX-12 — Who can write

| Role | Can do |
|------|--------|
| `super_admin` | Everything, including user create and delete |
| `admin` | Catalogue and intake writes. No user management |
| `editor` | Catalogue writes and intake status or delete. No user management |
| `staff` | Read the admin API. Patch order, message, and subscriber status. No catalogue writes. No intake deletes. No user management |

Every admin route runs `requireStaff` first. Catalogue `POST`/`PATCH`/`DELETE` also run `requireContentWriter` (`super_admin`, `admin`, `editor`). Intake deletes run `requireEngagementDelete` (same three). User routes run `requireRole("super_admin")`. A missing permission is `403` `{ "error": { "code": "FORBIDDEN", "message": "You do not have permission to do that" } }`.

### ✅ FIX-13 — Newsletter

Store the email lowercased. If a row exists with status `subscribed`, return `409` and message `This email is already subscribed.` If the row exists with `unsubscribed`, set it back to `subscribed`, send the welcome mail, and return `{ "ok": true }`. New emails insert a row.

### ✅ FIX-14 — Mail is outside the transaction

Order insert commits first. Then `sendOrderMails` runs. `src/services/mail.service.ts` catches Resend errors and returns `false`. The HTTP handler still returns `{ "reference" }`. Same pattern for contact and newsletter. With no API key the log line is:

`[mail] not sent (RESEND_API_KEY missing): to=... subject=...`

### ✅ FIX-15 — Seed image URLs

Frontend product photos are Vite imports such as `@/assets/products/tydisil-tablet.jpeg`. Those are not URLs the API can store. Seed `products.image_url` and `categories.image_url` as `NULL`. The site's `productImage()` falls back to the slug map when `image_url` is empty. News `image` is `NOT NULL`, so seed uses one public Unsplash URL until someone uploads pack shots to Cloudinary and patches the rows. Hero and page images are `NULL` for the same reason. `logo_url` stays `/osworth-logo.png`.

### ✅ FIX-16 — SQL file is the schema

`src/db/sql/001_init.sql` is the schema. `src/db/migrate.ts` reads every `src/db/sql/*.sql` file in sorted order, strips `--` comments, and runs each statement on its own. Do not turn on `multipleStatements` for the app pool. Drizzle is not installed. The original guide allowed raw SQL.

### ✅ FIX-17 — Audit cannot be deleted

Register `DELETE /api/v1/admin/audit` and respond `405`:

```json
{ "error": { "code": "METHOD_NOT_ALLOWED", "message": "Audit logs are permanent and cannot be deleted." } }
```

There is no clear-audit service.

### ✅ FIX-18 — Upload folders

Allowed folders: `osworth/products`, `osworth/hero`, `osworth/news`, `osworth/avatars`, `osworth/misc`. Any other `folder` field, including a missing one, is stored in `osworth/misc`.

### ✅ FIX-19 — JWT `sid`

Access token payload is `{ sub, role, email, sid }`. `sid` is `sessions.id`. `requireAuth` loads the user and requires that session to be unrevoked. `last_active_at` is updated only when it is older than one minute.

### ✅ FIX-20 — List envelopes

Public and admin catalogue lists are JSON arrays, not `{ data: [] }`. That lets the site replace `getProducts()` with `response.json()` later. These are objects, not arrays: settings, one product, login, dashboard, analytics overview, audit.

### ✅ FIX-21 — Stable slugs

On create, slug is `slugify(body.slug or body.name)`. `slugify` lowercases, trims, and turns every non `[a-z0-9]` run into a single `-`, then strips end dashes. Empty result is `400` `Could not build a slug from that name`. A taken slug is `409` `That slug is already in use`. On patch, change the slug only when `slug` is present in the body. Changing `name` alone must leave the public URL alone.

### ✅ FIX-22 — Category filter

`GET /products?category=` matches `products.category` (the display name, for example `Antifungal`) OR the category whose `slug` equals the query (for example `antifungal`). `featured=true|false|1|0`. `sort=sort_order|name|newest`. `sort_order` is the default. `q` matches name, active ingredient, and short description. Escape `%`, `_`, and `\` in the LIKE pattern.

### ✅ FIX-23 — Seed is insert-ignore

`npm run db:seed` inserts the super admin, settings, and catalogue with `INSERT IGNORE`. A second run does not reset the password and does not overwrite CMS edits. To change the seed password, delete that user row or drop the database, then seed again. Password hashes use bcrypt cost 12.

## Shared behaviour

Base path: `/api/v1`.

Success codes:

| Action | Status |
|--------|--------|
| GET | 200 |
| POST create | 201 |
| PATCH | 200 |
| DELETE | 204 with an empty body |
| Analytics ingest | 202 `{ "ok": true }` |
| Password change and logout | 204 |

Error body, every non-2xx:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Invalid request body", "details": {} } }
```

| Code | Status | When |
|------|--------|------|
| `VALIDATION_ERROR` | 400 | Zod failed, bad id, empty patch, bad cursor, bad image |
| `INVALID_JSON` | 400 | Body is not JSON |
| `INVALID_CREDENTIALS` | 401 | Wrong login |
| `UNAUTHENTICATED` | 401 | Missing or expired token, dead session |
| `FORBIDDEN` | 403 | Role check failed |
| `NOT_FOUND` | 404 | Missing row or unknown route |
| `CONFLICT` | 409 | Duplicate slug, email, or subscription |
| `METHOD_NOT_ALLOWED` | 405 | Audit delete |
| `RATE_LIMITED` | 429 | Too many auth or public writes |
| `UPLOADS_UNAVAILABLE` | 503 | Image is valid but Cloudinary env is empty |
| `INTERNAL` | 500 | Unexpected. Development adds `details` with the error message. Production does not |

Ids in `:id` params must be UUID strings. Seed ids look like `00000000-0000-4000-a000-000000000001` and pass Zod's UUID check.

Mutating admin work and login/logout call `withAudit`. That opens a transaction, runs the write, inserts `audit_logs`, then commits. A thrown error rolls both back. Public orders use `withTx` without an audit row, because there is no staff actor.

Audit sentences that must stay stable:

| Action | Summary |
|--------|---------|
| Login | `Signed in to the dashboard` |
| Logout | `Signed out of the dashboard` |
| Profile patch | `Updated their profile details` |
| Password | `Changed their account password` |
| Invite | `Created a new admin account for {name} ({email}) and sent login details by email` |
| Remove user | `Removed admin account for {name} ({email})` |
| Revoke current session | `Ended their current session` |
| Revoke other session | `Revoked a signed-in session on another device` |
| Create product | `Created the product "{name}"` |
| Update product | `Updated the product "{name}"` |
| Delete product | `Deleted the product "{name}"` |
| Same pattern | category, hero slide, distributor, news article, career role |
| Page | `Created the page section {pageKey}/{sectionKey}` and the update/delete variants |
| Settings | `Updated site settings` |
| Order status | `Marked order request {reference} as {status}` |
| Delete order | `Deleted order request {reference}` |
| Message status | `Marked contact message from {name} as {status}` |
| Delete message | `Deleted contact message from {name}` |
| Subscriber | `Updated subscriber {email} to {status}` |
| Delete subscriber | `Removed subscriber {email}` |
| Upload | `Uploaded an image to {folder}` |
| FAQ | `Created an FAQ in {category}`, `Updated an FAQ`, `Deleted an FAQ` |

Cookie: name `osworth_refresh`, `httpOnly`, `sameSite=lax`, `path=/api/v1/auth`, `secure` only when `COOKIE_SECURE=true`. Max age comes from `JWT_REFRESH_TTL`.

CORS: `credentials: true`. Allow origins in `CORS_ORIGINS`. Allow requests with no `Origin` so curl and server tests work. Reject other origins.

Rate limits, window 15 minutes: login 10 in production, public POST 30 in production. Outside production the cap is at least 300 so local tests can rerun. `trust proxy` is 1 so the limiter sees the real client behind a proxy.

## File map

```
backend-osworth/
  package.json
  tsconfig.json
  Dockerfile
  docker-compose.yml
  .env.example
  README.md
  BACKEND.md
  src/index.ts                      listen on PORT
  src/app.ts                        helmet, cors, json, cookies, routes
  src/config/env.ts                 zod env, process.exit on failure
  src/types/staff.ts                StaffRole, PublicUser
  src/types/express.d.ts            req.staff
  src/lib/httpError.ts
  src/db/pool.ts                    mysql2 pool, dateStrings, timezone Z
  src/db/sql.ts                     query, exec, withTx, withAudit
  src/db/map.ts                     toIso, toDateOnly, flag, asJson
  src/db/migrate.ts
  src/db/seed.ts
  src/db/seed-data.ts
  src/db/verify.ts
  src/db/sql/001_init.sql
  src/middleware/auth.ts
  src/middleware/errorHandler.ts
  src/middleware/rateLimit.ts
  src/middleware/validate.ts
  src/middleware/asyncHandler.ts
  src/utils/slugify.ts
  src/utils/ids.ts
  src/utils/passwords.ts
  src/utils/tokens.ts
  src/utils/cookies.ts
  src/validations/schemas.ts
  src/emails/templates.ts
  src/services/auth.service.ts
  src/services/catalogue.service.ts
  src/services/engagement.service.ts
  src/services/analytics.service.ts
  src/services/audit.service.ts
  src/services/mail.service.ts
  src/services/uploads.service.ts
  src/routes/auth.routes.ts
  src/routes/public.routes.ts
  src/routes/admin.routes.ts
```

Imports use the `.js` extension because `package.json` has `"type": "module"` and `tsconfig` targets Node16. `tsx` resolves those imports back to `.ts`.

## ✅ Phase 1 — Scaffold

Do this first. Do not create tables in this phase.

1. Create the files in the map from `package.json` through `src/app.ts`, plus `src/lib/httpError.ts`, `src/config/env.ts`, and the middleware files.
2. `createApp()` must mount, in this order: `helmet`, `cors`, `express.json({ limit: "1mb" })`, `cookieParser`, a finish logger that prints method, path, status, and milliseconds, then routers.
3. Mount `authRouter` at `/api/v1/auth`, `adminRouter` at `/api/v1/admin`, `publicRouter` at `/api/v1`. Admin must be mounted before the public router so `/api/v1/admin/...` is not swallowed.
4. Unknown routes call `next(new HttpError(404, "NOT_FOUND", "Route not found"))`.
5. `GET /api/v1/health` runs `SELECT 1`. Up: `200 { "ok": true, "db": "up" }`. Down: `503 { "ok": false, "db": "down" }`.
6. Required env, validated by Zod, process exits if missing: `APP_URL`, `CORS_ORIGINS`, `DATABASE_URL` (must start with `mysql://`), `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` (min 16), `EMAIL_FROM`, `OPS_EMAIL`, `SEED_SUPER_ADMIN_EMAIL`, `SEED_SUPER_ADMIN_PASSWORD` (min 8). Defaults: `PORT=4000`, `NODE_ENV=development`, `JWT_ACCESS_TTL=15m`, `JWT_REFRESH_TTL=7d`.
7. Copy `.env.example` to `.env`. Local demo login matches the current site hint: `admin@osworth.local` / `osworth2027`. Change both before any shared deployment.

Verify: `npx tsc -p tsconfig.json --noEmit` exits 0. With MySQL down, `GET /api/v1/health` is 503 and the process stays up.

Done when health, the error JSON, and env failure behaviour exist. ✅

## ✅ Phase 2 — Schema, migrate, seed

Start only after Phase 1 is ✅.

1. Put the tables below in `src/db/sql/001_init.sql` using `CREATE TABLE IF NOT EXISTS`, `ENGINE=InnoDB`, `utf8mb4`, `utf8mb4_unicode_ci`.
2. Use `CHAR(36)` ids, `DATETIME(3)` timestamps, `TINYINT(1)` flags, `JSON` for `products.gallery` and `order_requests.items`.
3. `users.role` is `ENUM('super_admin','admin','editor','staff')`.
4. Unique keys: `users.email`, `sessions.refresh_token_hash`, `categories.slug`, `products.slug`, `pages (page_key, section_key)`, `news_posts.slug`, `order_requests.reference`, `newsletter_subscribers.email`.
5. `sessions.user_id` references `users` `ON DELETE CASCADE`. `audit_logs.actor_user_id` references `users` `ON DELETE SET NULL`.
6. `site_settings.key` is the primary key. The only row is `global`. Quote `` `key` `` in SQL.
7. `npm run db:migrate` applies every SQL file and then `pool.end()` so the process can exit.
8. `docker-compose.yml` runs `mysql:8.4` database `osworth`, user `osworth`, password `osworth`, port `3306`.
9. Seed counts, ids from `nid(group, n)` = `00000000-0000-4000-{group}-{n padded to 12}`:

| Table | Count | Id group |
|-------|-------|----------|
| products | 15 | `a000` numbers 1–15, skipping none of the live slugs |
| categories | 11 | `a000` numbers 21–31 |
| hero_slides | 4 | `a400` |
| distributors | 8 | `a500` |
| pages | 5 | `a200` |
| news_posts | 7 | `a600` |
| faqs | 6 | `a700` |
| career_roles | 3 | `a100` |
| users super admin | 1 | `a300` |
| site_settings | 1 | key `global` |

Copy names, slugs, categories, pack sizes, and distributor rows from `osworth-health-hub/src/lib/catalog.ts`, `src/lib/content.ts`, and the distributor list in `src/lib/content-store.ts`. News seed stores the live title, slug, date, category, excerpt, and the opening paragraph. Product `gallery` is `[]`. Status values are `published`. Featured products are Tydisil tablet, ciprofloxacin, metformin, Borocare, and vitamin C syrup.

10. `npm run db:verify` fails if any count is short, `global` settings are missing, or bcrypt does not accept `SEED_SUPER_ADMIN_PASSWORD`.

Verify:

```text
docker compose up -d
npm run db:migrate
npm run db:seed
npm run db:verify
```

`db:verify` must print `Database verification passed`. ✅

## ✅ Phase 3 — Auth

Start only after Phase 2 is ✅ and `db:verify` passes.

Routes:

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/v1/auth/login` | Public, rate limited |
| POST | `/api/v1/auth/refresh` | `osworth_refresh` cookie |
| POST | `/api/v1/auth/logout` | Bearer or cookie |
| GET | `/api/v1/auth/me` | Bearer |
| GET/PATCH | `/api/v1/admin/profile` | Bearer |
| POST | `/api/v1/admin/profile/password` | Bearer |
| GET | `/api/v1/admin/sessions` | Bearer |
| DELETE | `/api/v1/admin/sessions/:id` | Bearer, own sessions only |
| GET/POST | `/api/v1/admin/users` | `super_admin` |
| DELETE | `/api/v1/admin/users/:id` | `super_admin` |

Login body: `{ "email", "password" }`. Email is trimmed. Compare with `LOWER(email)`. Response `200` `{ accessToken, expiresIn, user }` and `Set-Cookie`. `expiresIn` is the string `15m`, not a number of seconds.

Refresh reads the cookie, finds `refresh_token_hash = sha256(token)` and `revoked_at IS NULL`, rotates the hash, and returns a new access token plus a new cookie. A reused old refresh token no longer matches, so it is `401`. This build does not revoke the whole session family. That can be a later hardening item.

Access token lifetime is `JWT_ACCESS_TTL`. Refresh cookie lifetime is `JWT_REFRESH_TTL`. Sign with `JWT_ACCESS_SECRET`. Do not put the refresh token in JSON.

Profile patch fields: `name`, `phone`, `address`, `email`, `avatarUrl`. Duplicate email is `409` `That email is already in use`.

Create-user body: `{ "name", "email", "phone?", "address?" }`. Temp password alphabet matches the site: prefix `Ow-` plus 10 characters from `ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789`, using `randomBytes` rather than `Math.random`.

Revoking the current session clears the refresh cookie.

Verify with the e2e steps: login 200, refresh 200, invitee can login with `temporaryPassword`, super admin can delete that user, logout 204. ✅

## ✅ Phase 4 — Public reads

Start only after Phase 3 is ✅.

All of these are public and return only published, active, or visible rows.

| Method | Path | Notes |
|--------|------|-------|
| GET | `/products` | `q`, `category`, `featured`, `sort` |
| GET | `/products/:slug` | 404 if missing or not published |
| GET | `/categories` | `sort_order`, then name |
| GET | `/categories/:slug` | 404 if missing or not published |
| GET | `/hero-slides` | `active = 1`, `sort_order` |
| GET | `/distributors` | `state`, `region`, exact match |
| GET | `/pages` | optional `page_key`, `visible = 1` |
| GET | `/pages/:pageKey/:sectionKey` | visible only |
| GET | `/settings` | the `global` object, snake_case, same keys as `SiteSettings` |
| GET | `/news` | `published_on` descending |
| GET | `/news/:slug` | FIX-1 shape |
| GET | `/careers` | published, `sort_order` |
| GET | `/faqs` | optional `category` |

Catalogue objects use snake_case and match `src/lib/types.ts`: `image_url`, `pack_size`, `sort_order`, `created_at`, `active_ingredient`, `full_description`, `featured` boolean, `gallery` string array. Careers and FAQs also include `status`, `sort_order`, and `created_at` even though the public types omit them. Extra fields are safe.

`GET /settings` when the row is missing is `404` `Site settings are not seeded`. Do not invent a row on read.

Verify: `GET /products` returns at least 15, `featured` is JSON `true`/`false` not `0`/`1`, `GET /products?category=antifungal&featured=true` includes `tydisil-tablet-250mg`, unknown slug is 404, news has string `date` and `image`. ✅

## ✅ Phase 5 — Public writes and email

Start only after Phase 4 is ✅.

| Method | Path | Success |
|--------|------|---------|
| POST | `/orders` | 201 `{ "reference": "OSW-XXXXXXXX" }` |
| POST | `/contact` | 201 `{ "ok": true }` |
| POST | `/newsletter` | 201 `{ "ok": true }` or 409 |

Order body, same fields as `submitOrderRequest`:

```json
{
  "full_name": "Ada Okonkwo",
  "organization": "City Pharmacy",
  "email": "ada@example.com",
  "phone": "08030000000",
  "state": "Lagos",
  "city": "Ikeja",
  "address": "12 Adeola Odeku",
  "preferred_contact": "Phone call",
  "notes": "",
  "items": [
    {
      "id": "product-uuid",
      "slug": "tydisil-tablet-250mg",
      "name": "TYDISIL TABLET 250MG",
      "packSize": "2 x 7 tablets",
      "quantity": 2,
      "notes": ""
    }
  ]
}
```

Required: `full_name`, `email`, `phone`, `state`, `city`, `address`, and at least one item. `quantity` is an integer from 1 to 999. Omit empty item notes from the stored JSON. Status starts at `new`.

Contact required: `name`, `email`, `message`. Optional: `phone`, `organization`, `state`, `subject`. Status starts at `new`.

Emails, from `src/emails/templates.ts`, HTML plus text:

| Trigger | To | Subject |
|---------|----|---------|
| Admin created | New admin | `Your Osworth admin login details` |
| Order created | Customer | `We received your order request {reference}` |
| Order created | `site_settings.email` or else `OPS_EMAIL` | `New order request {reference}` with Reply-To the customer |
| Contact created | Ops | `New contact message from {name}` with Reply-To the sender |
| Contact created | Sender | `We received your message` |
| Newsletter | Subscriber | `You are subscribed to Osworth updates` |
| Password changed | That user | `Your Osworth password was changed` |

Ops inbox: use `site_settings.email` when it is non-empty, otherwise `OPS_EMAIL`. The seed leaves settings email null, so local mail goes to `OPS_EMAIL`.

Verify: an order returns an `OSW-` reference, the log shows customer and ops subjects, a second subscribe of the same email is 409, and the order row remains after the mail log. ✅

## ✅ Phase 6 — Admin CRUD

Start only after Phase 5 is ✅.

Every path below is under `/api/v1/admin` and requires a bearer token.

| Resource | Routes | Writer rule |
|----------|--------|-------------|
| `/dashboard` | GET | any staff |
| `/products` | GET, POST, GET `/:id`, PATCH `/:id`, DELETE `/:id` | writers for mutations |
| `/categories` | GET, POST, PATCH `/:id`, DELETE `/:id` | writers |
| `/hero-slides` | GET, POST, PATCH `/:id`, PATCH `/:id/active`, DELETE `/:id` | writers |
| `/distributors` | GET, POST, PATCH `/:id`, DELETE `/:id` | writers |
| `/pages` | GET, POST, PATCH `/:id`, DELETE `/:id` | writers |
| `/settings` | GET, PATCH | writers for patch |
| `/news` | GET, POST, PATCH `/:id`, DELETE `/:id` | writers |
| `/careers` | GET, POST, PATCH `/:id`, DELETE `/:id` | writers |
| `/faqs` | GET, POST, PATCH `/:id`, DELETE `/:id` | writers |
| `/orders` | GET `?status`, PATCH `/:id` `{status}`, DELETE `/:id` | status: any staff; delete: writers |
| `/messages` | GET, PATCH `{status}`, DELETE | same as orders |
| `/subscribers` | GET, PATCH `{status}`, DELETE | same as orders |
| `/audit` | GET, DELETE is 405 | any staff can read |

Admin lists return every status, not only published. Optional product query: `status`, `q`.

Order status: `new`, `contacted`, `closed`. Message status: `new`, `read`. Subscriber status: `subscribed`, `unsubscribed`.

Product write fields match the `Product` type except the server sets `id` and `created_at`: `name`, `slug`, `category`, `subcategory`, `active_ingredient`, `pack_size`, `short_description`, `full_description`, `image_url`, `gallery`, `featured`, `status`, `sort_order`. Empty strings for nullable text become NULL. `gallery: []` must be stored, not skipped.

Page `page_key` and `section_key` match `^[a-z0-9-]+$`. A duplicate pair is `409` `That page section already exists`.

Settings patch cannot change `key`. It updates `` `key` = 'global' ``. Do not use `WHERE id = ?` on `site_settings`; that table has no `id` column.

Dashboard:

```json
{
  "products": 15,
  "categories": 11,
  "orders": { "total": 1, "new": 0 },
  "messages": { "total": 1, "unread": 1 },
  "subscribers": 1,
  "news": 7,
  "careers": 3
}
```

`orders.new` counts status `new`. `messages.unread` counts status `new`. `subscribers` counts status `subscribed` only.

Verify: create a draft product as the super admin, delete it, patch an order to `contacted`, and see `Signed in to the dashboard` in the audit list. ✅

## ✅ Phase 7 — Uploads

Start only after Phase 6 is ✅.

`POST /api/v1/admin/uploads` is `multipart/form-data` with field `file` and optional text field `folder`. Any staff member may upload, including an avatar. The route is not a catalogue-writer route.

Rules:

- MIME must be `image/jpeg`, `image/png`, `image/webp`, or `image/gif`. Otherwise `400` `Please choose an image file`.
- Max size 4MB. Multer `LIMIT_FILE_SIZE` becomes `400` `Image must be under 4MB`.
- If Cloudinary env is incomplete, a valid image returns `503` `Image uploads are not configured. Add Cloudinary credentials.`
- On success, upload with the Cloudinary Node SDK on the server. Do not expose an unsigned upload preset.
- Response `201`: `{ "url", "publicId", "width", "height" }` where `url` is `secure_url`.
- After a successful upload, audit `Uploaded an image to {folder}`. Do not audit a rejected file.
- The caller then PATCHes `image_url`, `avatarUrl`, or a gallery entry with `url`. This route does not attach the file to a product by itself.

Env: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

Verify: a text file is 400. A 1×1 PNG with empty Cloudinary env is 503. With real credentials, the same call returns a `secure_url` and an audit row. The credential success path needs a real Cloudinary account; the 400 and 503 paths were executed in `src/app.e2e.test.ts`. ✅

## ✅ Phase 8 — Analytics

Start only after Phase 7 is ✅.

| Method | Path | Body or query |
|--------|------|----------------|
| POST | `/api/v1/analytics/page-view` | `{ "path" }` matching `^/[A-Za-z0-9/_-]*$`, max 512 |
| POST | `/api/v1/analytics/product-view` | `{ "slug" }` matching `^[a-z0-9-]+$` |
| GET | `/api/v1/admin/analytics/overview` | `days` 1–90, default 14 |
| GET | `/api/v1/admin/analytics/pages` | top 50 paths |
| GET | `/api/v1/admin/analytics/products` | top 50 slugs |

Upsert:

```sql
INSERT INTO analytics_page_daily (day, path, views) VALUES (UTC_DATE(), ?, 1)
ON DUPLICATE KEY UPDATE views = views + 1
```

Use the same pattern for `analytics_product_daily` and `product_slug`.

Overview:

```json
{
  "totals": { "pageViews": 1, "productViews": 0 },
  "series": [{ "day": "2026-09-23", "pageViews": 1, "productViews": 0 }],
  "topPages": [{ "path": "/e2e-check", "views": 1 }],
  "topProducts": []
}
```

`series` includes every UTC day in the window, with zeros filled in. Do not seed the fake localStorage view counts. The dashboard should show real traffic only.

`/pages` and `/products` return arrays of `{ path, views }` and `{ slug, views }`.

Verify: `POST /analytics/page-view` with `{ "path": "/e2e-check" }` returns 202, then `GET /admin/analytics/pages` contains that path. ✅

## ✅ Phase 9 — Hardening

Start only after Phase 8 is ✅.

1. `helmet()` is on in `src/app.ts`.
2. CORS allow-list and credentials are on.
3. Auth and public POST routes use `express-rate-limit`.
4. Every body in `src/validations/schemas.ts` is parsed with Zod. Unknown query values used by handlers are stripped by the schema.
5. SQL values are placeholders. Table names passed to `updateById` come from the `TABLES` allow-list in `src/db/sql.ts`. Settings columns come from a fixed allow-list.
6. The request logger does not print `Authorization` or cookie values.
7. `Dockerfile` uses `node:20-alpine`, `npm ci`, `npm run build`, and `node dist/index.js`. `.dockerignore` excludes `node_modules`, `dist`, and `.env`.
8. bcrypt cost is 12. Audit responses contain no password material. Cloudinary secrets stay in env.

`npm test` runs the unit files and `src/app.e2e.test.ts`. If MySQL is down, the HTTP test skips with a message instead of failing the unit tests. With MySQL up and seeded, the HTTP test must pass.

Verify: `npm test` with the database up. ✅

## ✅ Phase 10 — Frontend cutover

Done in `osworth-health-hub`. The site uses `VITE_API_URL` and `src/lib/api.ts` for all CMS, auth, intake, audit, and analytics calls. Cart, favorites, and checkout remember-me stay in localStorage.

Verify locally with the API on `:4000` and the site on `:5173`: load `/products`, submit an order, sign in, edit a product, confirm the audit line.

## Local commands

```text
docker compose up -d
npm install
npm run db:migrate
npm run db:seed
npm run db:verify
npm run dev
npm test
```

API: `http://localhost:4000`  
Health: `GET /api/v1/health`  
Local demo login: `admin@osworth.local` / `osworth2027`

Production must set `NODE_ENV=production`, `COOKIE_SECURE=true`, real JWT secrets, `RESEND_API_KEY`, `EMAIL_FROM` on a verified domain, Cloudinary keys, and a new super-admin password.

## Security checklist

- [x] bcrypt cost 12
- [x] No plaintext passwords in the database or logs
- [x] Helmet and CORS allow-list
- [x] Rate limits on login and public POST routes
- [x] Zod on write bodies
- [x] Parameterized SQL
- [x] Audit responses omit password material
- [x] Cloudinary credentials stay on the server
- [x] Super admin cannot be deleted
- [ ] `COOKIE_SECURE=true` and HTTPS in the real deployment (local `.env` correctly keeps this false)

## Acceptance for API cutover

The API side of cutover is met:

1. Seeded MySQL has the live catalogue slugs and a working super-admin login.
2. Public reads do not need the CMS localStorage keys.
3. Order, contact, and newsletter writes persist. Required emails are attempted and do not roll the write back.
4. Admin product create/delete writes an audit row. Audit can be filtered and cannot be deleted.
5. A super admin can create an admin. That person can sign in with the temporary password.
6. Analytics ingest shows up on the admin analytics routes.

Phase 10 is still required before the website itself stops using localStorage.

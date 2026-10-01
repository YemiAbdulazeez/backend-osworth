#!/bin/sh
set -e

echo "==> Osworth API boot"
echo "    NODE_ENV=${NODE_ENV:-unset}"
echo "    PORT=${PORT:-4000}"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set."
  echo "Create a MySQL 8 database and set DATABASE_URL on this Render service."
  echo "Example: mysql://user:pass@host:3306/osworth?ssl-mode=REQUIRED"
  exit 1
fi

# Print host only (never credentials) so Render logs show what we are trying to reach.
DB_HOST=$(node -e "try { const u=new URL(process.env.DATABASE_URL); console.log(u.hostname+':'+(u.port||'3306')) } catch { console.log('unparseable') }")
echo "    DATABASE host: ${DB_HOST}"

echo "Running migrations..."
./node_modules/.bin/tsx src/db/migrate.ts
echo "Seeding (insert-ignore)..."
./node_modules/.bin/tsx src/db/seed.ts
echo "Starting API on 0.0.0.0:${PORT:-4000}..."
exec node dist/index.js

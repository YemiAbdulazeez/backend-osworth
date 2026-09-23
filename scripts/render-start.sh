#!/bin/sh
set -e
echo "Running migrations..."
npx tsx src/db/migrate.ts
echo "Seeding (insert-ignore)..."
npx tsx src/db/seed.ts
echo "Starting API..."
exec node dist/index.js

#!/usr/bin/env bash
# Copy local FreshLink Postgres data to Railway production.
#
# Usage:
#   RAILWAY_DATABASE_URL="postgresql://..." ./scripts/migrate-local-to-railway.sh
#
# Get RAILWAY_DATABASE_URL from:
#   Railway → Postgres → Connect → Public Network → DATABASE_URL

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

LOCAL_DATABASE_URL="${LOCAL_DATABASE_URL:-postgresql://karimnurudeen@localhost:5432/freshlink}"
RAILWAY_DATABASE_URL="${RAILWAY_DATABASE_URL:-${DATABASE_URL:-}}"

if [[ -z "$RAILWAY_DATABASE_URL" ]]; then
  echo "ERROR: Set RAILWAY_DATABASE_URL (or DATABASE_URL) to Railway public Postgres URL."
  exit 1
fi

DUMP_FILE="$ROOT/prisma/local-to-railway.dump.sql"

echo "==> Exporting local database..."
pg_dump "$LOCAL_DATABASE_URL" \
  --data-only \
  --no-owner \
  --no-acl \
  --exclude-table-data=_prisma_migrations \
  --file "$DUMP_FILE"

DUMP_SIZE="$(du -h "$DUMP_FILE" | cut -f1)"
echo "    Exported $DUMP_FILE ($DUMP_SIZE)"

echo "==> Clearing Railway data (keeps schema + migrations)..."
psql "$RAILWAY_DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> '_prisma_migrations'
  ) LOOP
    EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
  END LOOP;
END $$;
SQL

echo "==> Importing local data into Railway..."
psql "$RAILWAY_DATABASE_URL" -v ON_ERROR_STOP=1 -f "$DUMP_FILE"

echo ""
echo "==> Done. Verifying counts on Railway..."
psql "$RAILWAY_DATABASE_URL" -t -c "
SELECT 'users=' || COUNT(*) FROM users
UNION ALL SELECT 'farmers=' || COUNT(*) FROM farmer_profiles
UNION ALL SELECT 'produce=' || COUNT(*) FROM produce_listings WHERE status <> 'deleted'
UNION ALL SELECT 'orders=' || COUNT(*) FROM orders;
"

echo ""
echo "Test API: https://fresh-link-production.up.railway.app/api/v1/produce?limit=5"

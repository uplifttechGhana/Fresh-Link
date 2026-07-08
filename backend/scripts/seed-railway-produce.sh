#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: Set Railway public Postgres URL first."
  echo ""
  echo "Railway → Postgres service → Connect → Public Network → copy DATABASE_URL"
  echo ""
  echo "Then run:"
  echo '  DATABASE_URL="postgresql://..." ./scripts/seed-railway-produce.sh'
  exit 1
fi

echo "Seeding produce on Railway database..."
npm run seed:produce

echo ""
echo "Done. Test: https://fresh-link-production.up.railway.app/api/v1/produce?limit=5"

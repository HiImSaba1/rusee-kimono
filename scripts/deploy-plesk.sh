#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:?Set APP_DIR to the absolute private Plesk application directory}"
cd "$APP_DIR"

NODE_MAJOR="$(node -p "Number(process.versions.node.split('.')[0])")"
if [ "$NODE_MAJOR" -ne 22 ]; then
  echo "Node.js 22 is required for install, build and runtime." >&2
  exit 1
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL must be supplied by Plesk environment settings." >&2
  exit 1
fi

npm ci --legacy-peer-deps
node scripts/production-preflight.mjs
npm run db:migrate
npm run content:initialize:production
npm run build:plesk

echo "Plesk release built. Restart the Node.js application, then run the production preflight and health checks."

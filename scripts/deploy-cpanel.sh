#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:?Set APP_DIR to the absolute cPanel application directory}"
cd "$APP_DIR"

npm ci
npm run db:migrate
npm run content:initialize:production
npm run build
mkdir -p .next/standalone/.next/static .next/standalone/public
cp -R .next/static/. .next/standalone/.next/static/
cp -R public/. .next/standalone/public/

echo "Build complete. Restart the Node.js application from cPanel or Passenger."

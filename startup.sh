#!/usr/bin/env bash
set -euo pipefail

export $(grep -v '^#' .env.local | xargs)

echo "Starting PRISM backend on :${BACKEND_PORT:-8000}"
node backend/server.js &
BACK_PID=$!

echo "Starting PRISM frontend on :${PORT:-3000}"
npx next dev ./frontend -p "${PORT:-3000}" &
FRONT_PID=$!

trap 'kill $BACK_PID $FRONT_PID' INT TERM
wait

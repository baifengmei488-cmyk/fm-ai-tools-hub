#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_PORT="${TOOLVAULT_E2E_BACKEND_PORT:-8120}"
FRONTEND_PORT="${TOOLVAULT_E2E_FRONTEND_PORT:-5173}"
DB_PATH="${TOOLVAULT_E2E_DB_PATH:-$(mktemp -t toolvault-e2e-XXXXXX.db)}"
BACKEND_LOG="$(mktemp -t toolvault-backend-XXXXXX.log)"
FRONTEND_LOG="$(mktemp -t toolvault-frontend-XXXXXX.log)"
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  if [[ -n "$FRONTEND_PID" ]]; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
  if [[ -n "$BACKEND_PID" ]]; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  rm -f "$DB_PATH" "$BACKEND_LOG" "$FRONTEND_LOG"
}
trap cleanup EXIT

require_free_port() {
  local port="$1"
  if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Port $port is already in use." >&2
    return 1
  fi
}

wait_for_url() {
  local url="$1"
  local name="$2"
  for _ in $(seq 1 60); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.5
  done
  echo "$name did not become ready at $url" >&2
  echo "Backend log:" >&2
  cat "$BACKEND_LOG" >&2 || true
  echo "Frontend log:" >&2
  cat "$FRONTEND_LOG" >&2 || true
  return 1
}

require_free_port "$BACKEND_PORT"
require_free_port "$FRONTEND_PORT"

export TOOLVAULT_DATABASE_URL="sqlite+pysqlite:///$DB_PATH"
export TOOLVAULT_CORS_ORIGINS="http://localhost:$FRONTEND_PORT,http://127.0.0.1:$FRONTEND_PORT"

cd "$ROOT_DIR/backend"
uv run alembic upgrade head
uv run python -m app.cli.import_tools ../fixtures/sample-tool-import.json >/dev/null
uv run uvicorn app.main:app --host 127.0.0.1 --port "$BACKEND_PORT" >"$BACKEND_LOG" 2>&1 &
BACKEND_PID="$!"

wait_for_url "http://127.0.0.1:$BACKEND_PORT/api/health" "Backend"

cd "$ROOT_DIR/frontend"
VITE_API_BASE="http://127.0.0.1:$BACKEND_PORT" npm run dev -- --host 127.0.0.1 --port "$FRONTEND_PORT" >"$FRONTEND_LOG" 2>&1 &
FRONTEND_PID="$!"

wait_for_url "http://127.0.0.1:$FRONTEND_PORT" "Frontend"

PLAYWRIGHT_BASE_URL="http://127.0.0.1:$FRONTEND_PORT" npm run e2e

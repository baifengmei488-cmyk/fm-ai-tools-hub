#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_PORT="${TOOLVAULT_BACKEND_PORT:-8000}"
FRONTEND_PORT="${TOOLVAULT_FRONTEND_PORT:-5173}"
BACKEND_LOG="${TOOLVAULT_BACKEND_LOG:-$ROOT_DIR/.toolvault-backend.log}"
FRONTEND_LOG="${TOOLVAULT_FRONTEND_LOG:-$ROOT_DIR/.toolvault-frontend.log}"
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  if [[ -n "$FRONTEND_PID" ]]; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
  if [[ -n "$BACKEND_PID" ]]; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

stop_existing_toolvault_servers() {
  local kind="$1"
  local pattern=""
  case "$kind" in
    vite)
      pattern="frontend/node_modules/.bin/vite"
      ;;
    uvicorn)
      pattern="backend/.venv/bin/uvicorn|uv run --directory $ROOT_DIR/backend uvicorn"
      ;;
    *)
      echo "Unsupported server kind: $kind" >&2
      return 1
      ;;
  esac

  local pids=""
  pids="$(ps -axo pid=,command= | awk -v root="$ROOT_DIR" -v pattern="$pattern" '$0 ~ root && $0 ~ pattern { print $1 }')"
  if [[ -z "$pids" ]]; then
    return 0
  fi

  echo "Stopping old ToolVault $kind server processes: $pids"
  kill $pids 2>/dev/null || true
  sleep 0.5
  pids="$(ps -axo pid=,command= | awk -v root="$ROOT_DIR" -v pattern="$pattern" '$0 ~ root && $0 ~ pattern { print $1 }')"
  if [[ -n "$pids" ]]; then
    kill -9 $pids 2>/dev/null || true
  fi
}

require_free_port() {
  local port="$1"
  local name="$2"
  if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "$name port $port is already in use by a non-ToolVault process. Choose TOOLVAULT_${name}_PORT or stop that process." >&2
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
  echo "Backend log: $BACKEND_LOG" >&2
  cat "$BACKEND_LOG" >&2 || true
  echo "Frontend log: $FRONTEND_LOG" >&2
  cat "$FRONTEND_LOG" >&2 || true
  return 1
}

stop_existing_toolvault_servers "vite"
stop_existing_toolvault_servers "uvicorn"

require_free_port "$BACKEND_PORT" "BACKEND"
require_free_port "$FRONTEND_PORT" "FRONTEND"

export TOOLVAULT_CORS_ORIGINS="http://localhost:$FRONTEND_PORT,http://127.0.0.1:$FRONTEND_PORT"
export TOOLVAULT_FRONTEND_PORT="$FRONTEND_PORT"

cd "$ROOT_DIR/backend"
uv run alembic upgrade head
uv run uvicorn app.main:app --host 127.0.0.1 --port "$BACKEND_PORT" >"$BACKEND_LOG" 2>&1 &
BACKEND_PID="$!"
wait_for_url "http://127.0.0.1:$BACKEND_PORT/api/health" "Backend"

cd "$ROOT_DIR/frontend"
VITE_API_BASE="http://127.0.0.1:$BACKEND_PORT" npm run dev -- --host 127.0.0.1 --port "$FRONTEND_PORT" --strictPort >"$FRONTEND_LOG" 2>&1 &
FRONTEND_PID="$!"
wait_for_url "http://127.0.0.1:$FRONTEND_PORT" "Frontend"

cat <<EOF
ToolVault is running:
- Frontend: http://127.0.0.1:$FRONTEND_PORT
- Backend API: http://127.0.0.1:$BACKEND_PORT

Logs:
- Backend: $BACKEND_LOG
- Frontend: $FRONTEND_LOG

Use these addresses for this run. If you change ports later, set TOOLVAULT_BACKEND_PORT and TOOLVAULT_FRONTEND_PORT before running this script.
Press Ctrl+C to stop both servers.
EOF

wait

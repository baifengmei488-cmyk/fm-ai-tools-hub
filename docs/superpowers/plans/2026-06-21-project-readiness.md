# ToolVault Project Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add maintainer-facing project setup documentation and a repeatable PostgreSQL verification path for the ToolVault MVP.

**Architecture:** Keep product code unchanged. Add one README for day-to-day project usage, one PostgreSQL verification shell script for runtime validation against Docker Compose PostgreSQL, and one testing document that records manual/automatic PostgreSQL verification expectations and current results.

**Tech Stack:** Markdown, Bash, Docker Compose, PostgreSQL, FastAPI/uvicorn, Alembic, uv, npm, curl.

---

## File Structure

Create these files:

```text
toolvault/
  README.md                              # Main project usage and verification guide
  scripts/verify-postgres.sh             # PostgreSQL runtime verification script
  docs/testing/postgres-verification.md  # PostgreSQL verification notes and latest result
```

Responsibilities:

- `README.md`: project overview, local setup, run commands, test commands, safety notes, and verification commands.
- `scripts/verify-postgres.sh`: checks Docker/PostgreSQL, runs migrations, imports sample data, starts a temporary API server, verifies API responses, and cleans up only its own API process/logs.
- `docs/testing/postgres-verification.md`: explains the PostgreSQL verification procedure, success criteria, common failures, and the result from the current environment.

---

### Task 1: Add Project README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Confirm README is currently missing**

Run:

```bash
test ! -f README.md
```

Expected: command exits `0`, confirming there is no existing README to preserve.

- [ ] **Step 2: Create `README.md`**

Create `README.md` with this content:

```markdown
# ToolVault

ToolVault is a local-first knowledge base for development and testing tools. The MVP stores tool metadata, categories, tags, Markdown guides, import history, and public/login-required visibility. Claude remains responsible for local scanning and generating reviewed JSON import files; the web app stores, displays, and imports that data.

## Features

- Public tool catalog and tool detail pages
- Admin login with a single configured administrator
- JSON import flow for Claude-generated tool data
- Public vs. login-required visibility filtering
- Sensitive-content scanning before imports
- CLI import command for reviewed JSON files
- Playwright E2E workflow for the main browser flows

## Tech Stack

- Backend: FastAPI, SQLAlchemy, Alembic, PostgreSQL, pytest, ruff
- Frontend: React, Vite, Tailwind CSS, react-markdown, rehype-sanitize
- Tooling: uv, npm, Docker Compose, Playwright

## Requirements

- Python 3.12 or newer
- uv
- Node.js and npm
- Docker Desktop or a working Docker CLI for PostgreSQL verification

The project has been tested locally with Python 3.14.

## Local Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Default local values:

- Admin username: `admin`
- Admin password: `toolvault-admin-local`
- PostgreSQL host port: `5433`
- Frontend dev server: `http://127.0.0.1:5173`
- Backend API: `http://127.0.0.1:8000`

Do not put real tokens, passwords, cookies, private keys, or cloud access keys in import JSON files.

## Start PostgreSQL

```bash
docker compose up -d postgres
```

The Compose service uses database `toolvault`, user `toolvault`, and local password `toolvault_local_password` on host port `5433`.

## Run Backend Migrations

```bash
TOOLVAULT_DATABASE_URL=postgresql+psycopg://toolvault:toolvault_local_password@localhost:5433/toolvault \
  uv run --directory backend alembic upgrade head
```

## Import Sample Data

```bash
TOOLVAULT_DATABASE_URL=postgresql+psycopg://toolvault:toolvault_local_password@localhost:5433/toolvault \
  uv run --directory backend python -m app.cli.import_tools ../fixtures/sample-tool-import.json
```

Expected output contains `created` on the first import or `updated` on repeated imports.

## Start the Backend API

```bash
TOOLVAULT_DATABASE_URL=postgresql+psycopg://toolvault:toolvault_local_password@localhost:5433/toolvault \
  uv run --directory backend uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Health check:

```bash
curl http://127.0.0.1:8000/api/health
```

## Start the Frontend

Install dependencies once:

```bash
npm --prefix frontend install
```

Start Vite:

```bash
VITE_API_BASE=http://127.0.0.1:8000 npm --prefix frontend run dev -- --host 127.0.0.1 --port 5173
```

Open `http://127.0.0.1:5173`.

## Test Commands

Backend tests and lint:

```bash
uv run --directory backend pytest -q
uv run --directory backend ruff check .
```

Frontend build and lint:

```bash
npm --prefix frontend run build
npm --prefix frontend run lint
```

Browser E2E with a temporary SQLite database:

```bash
./scripts/run-e2e.sh
```

The E2E script starts a temporary backend and frontend, runs Playwright tests, then cleans up its temporary runtime files.

## PostgreSQL Verification

Run the PostgreSQL runtime verification script:

```bash
./scripts/verify-postgres.sh
```

The script:

1. Starts the Docker Compose PostgreSQL service.
2. Waits for the container to become healthy.
3. Runs Alembic migrations against PostgreSQL.
4. Imports `fixtures/sample-tool-import.json`.
5. Starts a temporary FastAPI API server.
6. Confirms `/api/health` and `/api/tools` work and that `Playwright MCP` is returned.

The script does not delete Docker volumes and does not run `docker compose down -v`.

See `docs/testing/postgres-verification.md` for details and troubleshooting.

## Security Notes

- Import JSON is treated as data only; command fields are never executed by the backend.
- Sensitive-content scanning rejects obvious real secrets before import.
- Web services do not scan local Claude configuration, MCP settings, or system directories.
- Keep production secrets out of `.env.example`, fixtures, screenshots, and docs.
```

- [ ] **Step 3: Inspect README diff**

Run:

```bash
git diff -- README.md
```

Expected: the README content matches Step 2.

- [ ] **Step 4: Commit README**

Run:

```bash
git add README.md
git commit -m "docs: add project README"
```

Expected: commit succeeds.

---

### Task 2: Add PostgreSQL Verification Script

**Files:**
- Create: `scripts/verify-postgres.sh`

- [ ] **Step 1: Create `scripts/verify-postgres.sh`**

Create `scripts/verify-postgres.sh` with this content:

```bash
#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_PORT="${TOOLVAULT_POSTGRES_VERIFY_PORT:-8130}"
DATABASE_URL="${TOOLVAULT_DATABASE_URL:-postgresql+psycopg://toolvault:toolvault_local_password@localhost:5433/toolvault}"
API_LOG="$(mktemp -t toolvault-postgres-api-XXXXXX.log)"
API_PID=""

cleanup() {
  if [[ -n "$API_PID" ]]; then
    kill "$API_PID" 2>/dev/null || true
  fi
  rm -f "$API_LOG"
}
trap cleanup EXIT

fail() {
  echo "PostgreSQL verification failed: $1" >&2
  exit 1
}

require_command() {
  local command_name="$1"
  command -v "$command_name" >/dev/null 2>&1 || fail "missing required command '$command_name'"
}

require_free_port() {
  local port="$1"
  if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    fail "port $port is already in use"
  fi
}

wait_for_postgres() {
  for _ in $(seq 1 60); do
    local status
    status="$(docker inspect -f '{{.State.Health.Status}}' toolvault-postgres 2>/dev/null || true)"
    if [[ "$status" == "healthy" ]]; then
      return 0
    fi
    sleep 1
  done
  docker ps --filter name=toolvault-postgres
  fail "PostgreSQL container did not become healthy"
}

wait_for_api() {
  for _ in $(seq 1 60); do
    if curl -fsS "http://127.0.0.1:$BACKEND_PORT/api/health" >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.5
  done
  echo "API log:" >&2
  cat "$API_LOG" >&2 || true
  fail "API did not become ready"
}

require_command docker
require_command uv
require_command curl
require_free_port "$BACKEND_PORT"

cd "$ROOT_DIR"

docker compose up -d postgres
wait_for_postgres

TOOLVAULT_DATABASE_URL="$DATABASE_URL" uv run --directory backend alembic upgrade head
TOOLVAULT_DATABASE_URL="$DATABASE_URL" uv run --directory backend python -m app.cli.import_tools ../fixtures/sample-tool-import.json >/tmp/toolvault-postgres-import.json

TOOLVAULT_DATABASE_URL="$DATABASE_URL" uv run --directory backend uvicorn app.main:app --host 127.0.0.1 --port "$BACKEND_PORT" >"$API_LOG" 2>&1 &
API_PID="$!"
wait_for_api

curl -fsS "http://127.0.0.1:$BACKEND_PORT/api/health" >/tmp/toolvault-postgres-health.json
curl -fsS "http://127.0.0.1:$BACKEND_PORT/api/tools" >/tmp/toolvault-postgres-tools.json

grep -q "Playwright MCP" /tmp/toolvault-postgres-tools.json || fail "imported tool was not returned by /api/tools"

echo "PostgreSQL verification passed."
echo "Import result: $(cat /tmp/toolvault-postgres-import.json)"
```

- [ ] **Step 2: Make script executable**

Run:

```bash
chmod +x scripts/verify-postgres.sh
```

Expected: command succeeds.

- [ ] **Step 3: Validate shell syntax**

Run:

```bash
bash -n scripts/verify-postgres.sh
```

Expected: command exits `0`.

- [ ] **Step 4: Run the script**

Run:

```bash
./scripts/verify-postgres.sh
```

Expected if Docker is available: prints `PostgreSQL verification passed.` and shows an import result.

Expected if Docker is unavailable: exits non-zero with a clear message such as `PostgreSQL verification failed: missing required command 'docker'` or a Docker daemon/connectivity error. If Docker is unavailable, do not change the script to fake success.

- [ ] **Step 5: Commit script**

Run:

```bash
git add scripts/verify-postgres.sh
git commit -m "test: add PostgreSQL verification script"
```

Expected: commit succeeds.

---

### Task 3: Add PostgreSQL Verification Notes

**Files:**
- Create: `docs/testing/postgres-verification.md`

- [ ] **Step 1: Determine current verification result**

Run:

```bash
./scripts/verify-postgres.sh
```

Expected: capture whether it passes or why it is blocked. Use the observed output in Step 2.

- [ ] **Step 2: Create `docs/testing/postgres-verification.md`**

If `./scripts/verify-postgres.sh` passed, create:

```markdown
# PostgreSQL Verification

## Goal

Verify that ToolVault works against the PostgreSQL service defined in `docker-compose.yml`, not only the temporary SQLite database used by E2E tests.

## Automatic Verification

Run:

```bash
./scripts/verify-postgres.sh
```

The script starts the PostgreSQL container, waits for the healthcheck, applies Alembic migrations, imports `fixtures/sample-tool-import.json`, starts a temporary FastAPI server, and verifies `/api/health` and `/api/tools`.

The script does not delete Docker volumes.

## Manual Verification

```bash
docker compose up -d postgres
TOOLVAULT_DATABASE_URL=postgresql+psycopg://toolvault:toolvault_local_password@localhost:5433/toolvault uv run --directory backend alembic upgrade head
TOOLVAULT_DATABASE_URL=postgresql+psycopg://toolvault:toolvault_local_password@localhost:5433/toolvault uv run --directory backend python -m app.cli.import_tools ../fixtures/sample-tool-import.json
TOOLVAULT_DATABASE_URL=postgresql+psycopg://toolvault:toolvault_local_password@localhost:5433/toolvault uv run --directory backend uvicorn app.main:app --host 127.0.0.1 --port 8000
curl http://127.0.0.1:8000/api/health
curl http://127.0.0.1:8000/api/tools
```

## Success Criteria

- PostgreSQL container is healthy.
- Alembic applies revision `20260618_0001`.
- Sample import returns `created` or `updated` counts.
- `/api/health` returns `{"status":"ok"}`.
- `/api/tools` returns `Playwright MCP`.

## Common Failures

- Docker CLI missing: install or start Docker Desktop.
- Docker daemon unavailable: start Docker Desktop and retry.
- Port `5433` occupied: stop the conflicting service or change the Compose mapping.
- Verification API port `8130` occupied: set `TOOLVAULT_POSTGRES_VERIFY_PORT` to a free port.
- Import rejected: inspect the JSON for real secrets or unsupported extra fields.

## Latest Result

- Date: 2026-06-21
- Command: `./scripts/verify-postgres.sh`
- Result: Passed.
- Evidence: The script printed `PostgreSQL verification passed.` and `/api/tools` contained `Playwright MCP`.
```

If `./scripts/verify-postgres.sh` was blocked because Docker is unavailable, create the same document but use this `Latest Result` section:

```markdown
## Latest Result

- Date: 2026-06-21
- Command: `./scripts/verify-postgres.sh`
- Result: Blocked by local environment.
- Evidence: Docker was unavailable or the Docker daemon was not reachable, so PostgreSQL runtime verification could not complete in this environment.
```

- [ ] **Step 3: Inspect docs diff**

Run:

```bash
git diff -- docs/testing/postgres-verification.md
```

Expected: document includes automatic verification, manual verification, success criteria, common failures, and latest result.

- [ ] **Step 4: Commit docs**

Run:

```bash
git add docs/testing/postgres-verification.md
git commit -m "docs: add PostgreSQL verification notes"
```

Expected: commit succeeds.

---

### Task 4: Final Verification and Cleanup

**Files:**
- Modify only if verification finds a concrete defect.

- [ ] **Step 1: Run backend checks**

Run:

```bash
uv run --directory backend pytest -q
uv run --directory backend ruff check .
```

Expected: tests and lint pass.

- [ ] **Step 2: Run frontend checks**

Run:

```bash
npm --prefix frontend run build
npm --prefix frontend run lint
```

Expected: build and lint pass.

- [ ] **Step 3: Run E2E checks**

Run:

```bash
./scripts/run-e2e.sh
```

Expected: Playwright E2E tests pass.

- [ ] **Step 4: Run PostgreSQL verification**

Run:

```bash
./scripts/verify-postgres.sh
```

Expected if Docker is available: verification passes.

Expected if Docker is unavailable: verification exits non-zero with a clear message, and `docs/testing/postgres-verification.md` records the environment blocker.

- [ ] **Step 5: If verification reveals a bug, follow TDD**

For each bug:

1. Capture the exact failing output.
2. Identify root cause.
3. Write the smallest failing test or script assertion.
4. Confirm the test fails for the expected reason.
5. Implement the minimal fix.
6. Re-run the failing check and related verification commands.
7. Update `docs/testing/postgres-verification.md` if the bug affects PostgreSQL verification.
8. Commit the fix.

- [ ] **Step 6: Final status check**

Run:

```bash
git status --short --branch
```

Expected: clean working tree.

---

## Self-Review

Spec coverage:

- README requirement: Task 1.
- PostgreSQL verification script: Task 2.
- PostgreSQL verification notes and current result: Task 3.
- Non-business-function scope: all tasks only create docs/scripts.
- Verification commands: Task 4.

Placeholder scan:

- This plan contains no unresolved placeholder markers.
- Every created file has complete content.
- Docker-unavailable and Docker-available outcomes are both explicit.

Type consistency:

- Script names match README and docs: `scripts/verify-postgres.sh` and `scripts/run-e2e.sh`.
- PostgreSQL URL matches `.env.example`.
- Verification API port `8130` is used consistently.

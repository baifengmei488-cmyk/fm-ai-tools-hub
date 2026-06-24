import subprocess
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[2]


def test_frontend_uses_strict_configured_dev_port():
    vite_config = (ROOT_DIR / "frontend" / "vite.config.ts").read_text(encoding="utf-8")

    assert "TOOLVAULT_FRONTEND_PORT" in vite_config
    assert "strictPort: true" in vite_config


def test_frontend_api_default_uses_canonical_backend_origin():
    client = (ROOT_DIR / "frontend" / "src" / "api" / "client.ts").read_text(encoding="utf-8")

    assert "http://127.0.0.1:8000" in client
    assert "http://localhost:8000" not in client


def test_dev_script_declares_canonical_ports_and_prevents_silent_reassignment():
    script_path = ROOT_DIR / "scripts" / "run-dev.sh"
    script = script_path.read_text(encoding="utf-8")

    assert 'BACKEND_PORT="${TOOLVAULT_BACKEND_PORT:-8000}"' in script
    assert 'FRONTEND_PORT="${TOOLVAULT_FRONTEND_PORT:-5173}"' in script
    assert 'VITE_API_BASE="http://127.0.0.1:$BACKEND_PORT"' in script
    assert 'require_free_port "$BACKEND_PORT"' in script
    assert 'require_free_port "$FRONTEND_PORT"' in script
    assert "--strictPort" in script


def test_dev_script_cleans_old_toolvault_processes_before_port_checks():
    script = (ROOT_DIR / "scripts" / "run-dev.sh").read_text(encoding="utf-8")

    assert "stop_existing_toolvault_servers" in script
    assert 'stop_existing_toolvault_servers "vite"' in script
    assert 'stop_existing_toolvault_servers "uvicorn"' in script
    assert "frontend/node_modules/.bin/vite" in script
    assert "backend/.venv/bin/uvicorn" in script
    assert "uv run --directory $ROOT_DIR/backend uvicorn" in script
    assert script.index("stop_existing_toolvault_servers") < script.index('require_free_port "$BACKEND_PORT"')


def test_dev_script_has_valid_shell_syntax():
    subprocess.run(["bash", "-n", str(ROOT_DIR / "scripts" / "run-dev.sh")], check=True)

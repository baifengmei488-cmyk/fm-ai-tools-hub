from dataclasses import dataclass
import re
import shlex
from typing import Any

SENSITIVE_KEY_RE = re.compile(
    r"(token|password|passwd|secret|cookie|private_key|api_key|apikey|accesskey|access_key)", re.I
)
SECRET_ASSIGNMENT_RE = re.compile(
    r"(?i)(openai[_-]?api[_-]?key|api[_-]?key|apikey|secret_key|private_key|access[_-]?key|"
    r"mysql_pass|password|passwd|secret|token|cookie)\s*[=:]\s*['\"]?([^\s'\"]+)"
)
PEM_PRIVATE_KEY_RE = re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----")
GITHUB_TOKEN_RE = re.compile(r"\b(?:gh[pousr]_|github_pat_)[A-Za-z0-9_]{20,}\b")
BEARER_TOKEN_RE = re.compile(r"(?i)\bBearer\s+([A-Za-z0-9._~+/=-]{20,})\b")
MYSQL_COMMANDS = {"mariadb", "mysql"}
PLACEHOLDER_VALUES = {
    "YOUR_TOKEN",
    "YOUR_PASSWORD",
    "your_password",
    "readonly_user",
    "toolvault-admin-local",
    "toolvault-local-development-secret",
}


@dataclass(frozen=True)
class SensitiveFinding:
    path: str
    reason: str


def _is_placeholder(value: str) -> bool:
    if value in PLACEHOLDER_VALUES:
        return True
    lowered = value.lower()
    return lowered.startswith("your_") or lowered.startswith("example_") or lowered.startswith("change_me")


def _is_mysql_command(value: str) -> bool:
    try:
        command_parts = shlex.split(value)
    except ValueError:
        return False
    if not command_parts:
        return False
    return command_parts[0].rsplit("/", maxsplit=1)[-1] in MYSQL_COMMANDS


def _find_mysql_inline_password(value: str) -> str | None:
    if not _is_mysql_command(value):
        return None
    try:
        command_parts = shlex.split(value)
    except ValueError:
        return None
    for part in command_parts[1:]:
        if part.startswith("-p") and len(part) > 2:
            return part[2:]
    return None


def _scan_string(path: str, value: str) -> list[SensitiveFinding]:
    findings: list[SensitiveFinding] = []
    for match in SECRET_ASSIGNMENT_RE.finditer(value):
        assigned = match.group(2).strip()
        if not _is_placeholder(assigned):
            findings.append(SensitiveFinding(path=path, reason=f"secret assignment for {match.group(1)}"))
    mysql_password = _find_mysql_inline_password(value)
    if mysql_password and not _is_placeholder(mysql_password):
        findings.append(SensitiveFinding(path=path, reason="inline mysql password"))
    if PEM_PRIVATE_KEY_RE.search(value):
        findings.append(SensitiveFinding(path=path, reason="private key block"))
    github_match = GITHUB_TOKEN_RE.search(value)
    if github_match and not _is_placeholder(github_match.group(0)):
        findings.append(SensitiveFinding(path=path, reason="github token"))
    bearer_match = BEARER_TOKEN_RE.search(value)
    if bearer_match and not _is_placeholder(bearer_match.group(1)):
        findings.append(SensitiveFinding(path=path, reason="bearer token"))
    return findings


def find_sensitive_findings(payload: Any, path: str = "") -> list[SensitiveFinding]:
    findings: list[SensitiveFinding] = []
    if isinstance(payload, dict):
        for key, value in payload.items():
            child_path = f"{path}.{key}" if path else str(key)
            if SENSITIVE_KEY_RE.search(str(key)) and isinstance(value, str) and not _is_placeholder(value):
                findings.append(SensitiveFinding(path=child_path, reason=f"sensitive key {key}"))
            findings.extend(find_sensitive_findings(value, child_path))
    elif isinstance(payload, list):
        for index, item in enumerate(payload):
            findings.extend(find_sensitive_findings(item, f"{path}[{index}]"))
    elif isinstance(payload, str):
        findings.extend(_scan_string(path, payload))
    return findings

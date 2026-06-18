from dataclasses import dataclass
import re
from typing import Any

SENSITIVE_KEY_RE = re.compile(r"(token|password|passwd|secret|cookie|private_key|accesskey|access_key)", re.I)
SECRET_ASSIGNMENT_RE = re.compile(
    r"(?i)(token|password|passwd|secret|cookie|access[_-]?key|mysql_pass)\s*[=:]\s*['\"]?([^\s'\"]+)"
)
MYSQL_INLINE_PASSWORD_RE = re.compile(r"-p(?!\s)([^\s]+)")
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


def _scan_string(path: str, value: str) -> list[SensitiveFinding]:
    findings: list[SensitiveFinding] = []
    for match in SECRET_ASSIGNMENT_RE.finditer(value):
        assigned = match.group(2).strip()
        if not _is_placeholder(assigned):
            findings.append(SensitiveFinding(path=path, reason=f"secret assignment for {match.group(1)}"))
    mysql_match = MYSQL_INLINE_PASSWORD_RE.search(value)
    if mysql_match and not _is_placeholder(mysql_match.group(1)):
        findings.append(SensitiveFinding(path=path, reason="inline mysql password"))
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

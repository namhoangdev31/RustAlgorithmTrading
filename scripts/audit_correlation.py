#!/usr/bin/env python3
"""Static audit for correlation_id usage in critical logging paths.

Exit codes:
- 0: no findings
- 1: findings detected (or invalid includes)
"""

from __future__ import annotations

import argparse
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List

PY_LOG_RE = re.compile(r"\b(logger|self\.logger)\.(debug|info|warning|error|exception|critical)\s*\(")
RUST_LOG_RE = re.compile(r"\b(?:tracing::)?(?:trace|debug|info|warn|error)!\s*\(")
CORR_RE = re.compile(r"correlation_id|\bcid\b|\[cid:[^\]]+\]", re.IGNORECASE)
SKIP_RE = re.compile(r"^\s*#|^\s*//")


@dataclass
class Finding:
    path: Path
    line_no: int
    line: str
    reason: str


DEFAULT_INCLUDE = [
    "src/bridge",
    "src/observability",
    "rust/common",
    "rust/signal-bridge",
    "rust/risk-manager",
    "rust/execution-engine",
]


def iter_files(base: Path, include_dirs: Iterable[str]) -> Iterable[Path]:
    for raw in include_dirs:
        root = (base / raw).resolve()
        if not root.exists():
            continue
        for p in root.rglob("*"):
            if not p.is_file():
                continue
            if p.suffix not in {".py", ".rs"}:
                continue
            parts = set(p.parts)
            if "__pycache__" in parts or "target" in parts:
                continue
            yield p


def audit_file(path: Path) -> List[Finding]:
    findings: List[Finding] = []
    try:
        lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    except OSError:
        return findings

    for idx, line in enumerate(lines, start=1):
        if SKIP_RE.search(line):
            continue
        if path.suffix == ".py" and PY_LOG_RE.search(line):
            if not CORR_RE.search(line):
                findings.append(Finding(path, idx, line.strip(), "python log call missing correlation_id context"))
        if path.suffix == ".rs" and RUST_LOG_RE.search(line):
            if not CORR_RE.search(line):
                findings.append(Finding(path, idx, line.strip(), "rust log macro missing correlation_id context"))
    return findings


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit correlation_id usage in log statements.")
    parser.add_argument("--root", default=".", help="Workspace root")
    parser.add_argument(
        "--include",
        action="append",
        default=[],
        help="Include directory (repeatable). Defaults to core cross-runtime paths.",
    )
    parser.add_argument(
        "--fail-on-findings",
        action="store_true",
        help="Return exit code 1 when findings exist.",
    )
    args = parser.parse_args()

    base = Path(args.root).resolve()
    includes = args.include or DEFAULT_INCLUDE

    files = list(iter_files(base, includes))
    if not files:
        print("[x] No files found in include paths.")
        return 1

    all_findings: List[Finding] = []
    for file in files:
        all_findings.extend(audit_file(file))

    print(f"[i] Scanned {len(files)} files across {len(includes)} include roots.")
    if not all_findings:
        print("[✓] No correlation_id logging gaps found.")
        return 0

    print(f"[x] Found {len(all_findings)} potential correlation logging gaps:")
    for finding in all_findings:
        rel = finding.path.relative_to(base)
        print(f"  - {rel}:{finding.line_no} :: {finding.reason}")
        print(f"    {finding.line}")

    return 1 if args.fail_on_findings else 0


if __name__ == "__main__":
    raise SystemExit(main())

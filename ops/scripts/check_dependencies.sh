#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

info() { echo -e "${BLUE}[INFO]${NC} $*"; }
ok() { echo -e "${GREEN}[OK]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; WARNINGS=$((WARNINGS + 1)); }
err() { echo -e "${RED}[ERR]${NC} $*"; ERRORS=$((ERRORS + 1)); }

require_cmd() {
    if command -v "$1" >/dev/null 2>&1; then
        ok "$1 found"
    else
        err "$1 missing"
    fi
}

optional_cmd() {
    if command -v "$1" >/dev/null 2>&1; then
        ok "$1 found"
    else
        warn "$1 missing (optional)"
    fi
}

require_path() {
    if [ -e "$PROJECT_ROOT/$1" ]; then
        ok "$1 exists"
    else
        err "$1 missing"
    fi
}

optional_path() {
    if [ -e "$PROJECT_ROOT/$1" ]; then
        ok "$1 exists"
    else
        warn "$1 missing (optional)"
    fi
}

info "Checking core toolchain"
require_cmd python3
require_cmd cargo
require_cmd rustc
require_cmd go
optional_cmd uv
optional_cmd docker
optional_cmd jq

info "Checking workspace manifests"
require_path python/pyproject.toml
require_path rust/Cargo.toml
require_path go/go.mod
optional_path nextjs/package.json

info "Checking runtime configuration"
optional_path .env
require_path ops/config/system.json
require_path ops/config/risk_limits.toml
optional_path ops/config/data_download.json

info "Checking writable runtime directories"
mkdir -p "$PROJECT_ROOT/logs" "$PROJECT_ROOT/data" "$PROJECT_ROOT/pids"
ok "logs, data, and pids directories are ready"

info "Checking Python import surface"
if (cd "$PROJECT_ROOT/python" && python3 - <<'PY'
import importlib.util
missing = [name for name in ("numpy", "pandas", "pydantic") if importlib.util.find_spec(name) is None]
if missing:
    raise SystemExit("missing: " + ", ".join(missing))
PY
); then
    ok "Python baseline packages are importable"
else
    warn "Python baseline packages are incomplete; run dependency install inside python/ when needed"
fi

if [ "$ERRORS" -eq 0 ]; then
    ok "Dependency check completed with $WARNINGS warning(s)"
    exit 0
fi

err "Dependency check failed with $ERRORS error(s) and $WARNINGS warning(s)"
exit 1

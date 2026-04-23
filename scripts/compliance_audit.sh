#!/usr/bin/env bash
set -euo pipefail

CHECK_CORRELATION=false
CHECK_VERSIONING=false
LOG_FILE=""
MIN_LINES=1

usage() {
  cat <<'USAGE'
Usage:
  bash scripts/compliance_audit.sh [--check-correlation] [--check-versioning] [--log-file PATH] [--min-lines N]

Default behavior:
  - If no check flags are provided, both checks are enabled.
  - Auto-discover log file from common paths if --log-file is not set.
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --check-correlation)
      CHECK_CORRELATION=true
      shift
      ;;
    --check-versioning)
      CHECK_VERSIONING=true
      shift
      ;;
    --log-file)
      LOG_FILE="${2:-}"
      shift 2
      ;;
    --min-lines)
      MIN_LINES="${2:-1}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "[x] Unknown argument: $1"
      usage
      exit 2
      ;;
  esac
done

if [[ "$CHECK_CORRELATION" == false && "$CHECK_VERSIONING" == false ]]; then
  CHECK_CORRELATION=true
  CHECK_VERSIONING=true
fi

if [[ -z "$LOG_FILE" ]]; then
  candidates=(
    "logs/structured.log"
    "logs/app.log"
    "logs/observability.log"
    "tests/logs/observability.log"
    "tests/logs/system.log"
  )
  for c in "${candidates[@]}"; do
    if [[ -f "$c" ]]; then
      LOG_FILE="$c"
      break
    fi
  done
fi

if [[ -z "$LOG_FILE" || ! -f "$LOG_FILE" ]]; then
  echo "[x] No log file found. Set --log-file PATH or provide one of the default log paths."
  exit 1
fi

TOTAL_LINES=$(wc -l < "$LOG_FILE" | tr -d ' ')
if [[ "$TOTAL_LINES" -lt "$MIN_LINES" ]]; then
  echo "[x] Log file '$LOG_FILE' has too few lines ($TOTAL_LINES < $MIN_LINES)."
  exit 1
fi

echo "[i] Auditing log file: $LOG_FILE"

declare -i failed=0

if [[ "$CHECK_CORRELATION" == true ]]; then
  CORR_HITS=$(grep -Ec 'correlation_id|\[cid:[^]]+\]' "$LOG_FILE" || true)
  if [[ "$CORR_HITS" -gt 0 ]]; then
    echo "[✓] correlation_id coverage check passed ($CORR_HITS hits)."
  else
    echo "[x] correlation_id coverage check failed (0 hits)."
    failed+=1
  fi
fi

if [[ "$CHECK_VERSIONING" == true ]]; then
  VERSION_HITS=$(grep -Ec 'schema_version|"schema_version"' "$LOG_FILE" || true)
  if [[ "$VERSION_HITS" -gt 0 ]]; then
    echo "[✓] schema_version coverage check passed ($VERSION_HITS hits)."
  else
    echo "[x] schema_version coverage check failed (0 hits)."
    failed+=1
  fi
fi

# Week 5: Redaction Check
echo "[i] Running redaction compliance check..."
REDACTION_LEAKS=$(grep -Ec 'limit_snapshot":\s*\{' "$LOG_FILE" || true)
if [[ "$REDACTION_LEAKS" -eq 0 ]]; then
  echo "[✓] Redaction compliance passed (0 leaks found)."
else
  echo "[x] Redaction compliance FAILED ($REDACTION_LEAKS potential leaks found)."
  failed+=1
fi

if [[ "$failed" -gt 0 ]]; then
  echo "[x] Compliance audit failed ($failed check(s) failed)."
  exit 1
fi

echo "[✓] Compliance audit passed."

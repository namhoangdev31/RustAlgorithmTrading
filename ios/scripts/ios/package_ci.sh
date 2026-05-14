#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IOS_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
PACKAGE_DIR="${IOS_ROOT}/Libraries/AdaptiveSwiftUi"

if [[ ! -d "${PACKAGE_DIR}" ]]; then
  echo "AdaptiveSwiftUi package not found at ${PACKAGE_DIR}" >&2
  exit 1
fi

cd "${PACKAGE_DIR}"

echo "[1/4] swift package reset"
if ! swift package reset; then
  echo "swift package reset failed, continuing with manual cleanup fallback."
fi

echo "[2/4] clear module/build caches"
chmod -R u+w .build 2>/dev/null || true
rm -rf .build
rm -rf .swiftpm/xcode/xcuserdata
rm -rf "${HOME}/Library/Developer/Xcode/DerivedData/ModuleCache.noindex"
rm -rf "${HOME}/Library/Developer/Xcode/DerivedData/SDKStatCaches.noindex"

mkdir -p .build/clang-module-cache .build/swift-module-cache
export CLANG_MODULE_CACHE_PATH="${PACKAGE_DIR}/.build/clang-module-cache"
export SWIFT_MODULE_CACHE_PATH="${PACKAGE_DIR}/.build/swift-module-cache"

echo "[3/4] swift test"
swift test

echo "[4/4] swift test --enable-code-coverage"
swift test --enable-code-coverage

if CODECOV_PATH="$(swift test --show-codecov-path 2>/dev/null)" && [[ -f "${CODECOV_PATH}" ]]; then
  echo "Coverage artifact: ${CODECOV_PATH}"
fi

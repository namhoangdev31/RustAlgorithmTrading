# Changelog

All notable changes to `AdaptiveSwiftUi` are documented in this file.

The format follows Keep a Changelog and Semantic Versioning with internal tags.

## [Unreleased]

### Added
- Deterministic package CI script at `ios/scripts/ios/package_ci.sh`:
  1. `swift package reset`
  2. module/build cache cleanup
  3. `swift test`
  4. `swift test --enable-code-coverage`
- Dedicated macOS workflow: `.github/workflows/ios-adaptive-swiftui.yml` with strict library gates.
- Parser hardening tests:
  - malformed XML
  - missing `content:encoded`
  - duplicate GUID behavior
  - invalid GUID behavior
  - parser performance gate `p95 < 150ms`
- Snapshot invariant tests for:
  - `lastBuildDate`
  - unique GUID count
  - component distribution

### Changed
- Unified test target to `AdaptiveSwiftUiTests` only.
- Removed legacy test target `SwiftUIInternalKitTests` from `Package.swift`.
- Updated test naming for CI readability:
  - `RSS_CASE_VALIDATE`
  - `RSS_COMPONENT_VALIDATE`

### Removed
- Legacy test directory `Tests/SwiftUIInternalKitTests`.

## [v0.1.0-rc1] - 2026-05-14

### Planned release candidate checklist
- All strict gates pass in `ios-adaptive-swiftui` workflow.
- Coverage artifact uploaded.
- `iosApp` integration compile gate passes.
- Rollback drill passes using `docs/ROLLBACK_RUNBOOK.md`.

## [v0.1.0] - TBD

### Planned first stable release
- Promote from latest `v0.1.0-rcN` after successful pilot rollout.
- Freeze API surface of `AdaptiveSwiftUi` for first stable consumer rollout.

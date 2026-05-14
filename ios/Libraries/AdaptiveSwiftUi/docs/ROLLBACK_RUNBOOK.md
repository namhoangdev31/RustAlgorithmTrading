# AdaptiveSwiftUi Rollback Runbook

Owner: iOS Platform Team

Target SLA: rollback to previous stable tag in under 15 minutes.

## 1) Preconditions
- Previous stable tag exists (example: `v0.0.9` or previous `v0.1.0-rcN`).
- Current failing tag is identified.
- On-call owner is assigned.

## 2) Rollback commands

### A. Re-pin package in app repository
1. Open `iosApp.xcodeproj` package dependency settings.
2. Set dependency version back to the previous stable tag.
3. Or from git-based dependency flow, pin the tag directly:

```bash
git fetch --tags
git checkout <app-branch>
# update Package.resolved or package dependency version to previous tag
git add .
git commit -m "rollback(AdaptiveSwiftUi): pin to <previous-tag>"
```

### B. Validate rollback build

```bash
cd ios/Libraries/AdaptiveSwiftUi
bash ../../scripts/ios/package_ci.sh
cd ../../
xcodebuild -project iosApp.xcodeproj -scheme iosApp -configuration Debug -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build
```

## 3) Verification checklist
- Package tests pass.
- Coverage job still publishes artifact.
- App integration compile passes.
- No API call-site breakage in `iosApp`.

## 4) Incident closeout
- Record failing tag and root cause in release notes.
- Open follow-up issue for forward fix.
- Schedule rollback drill verification before next stable tag.

## 5) Release drill cadence
- Run rollback drill for each major/minor release candidate (`vX.Y.Z-rcN`).

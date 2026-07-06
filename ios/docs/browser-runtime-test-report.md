# Browser Runtime Test Report

Date: 2026-07-06
Simulator: iPhone 17 Pro, `5D1EC347-ED5D-41D9-BA40-FCD65E46A9DF`
Project: `iosApp.xcodeproj`, scheme `iosApp`, bundle `com.lepos.lepos-app`

## Scope

This pass rechecked the Browser fixes described in `docs/browser-features.md` and `docs/browser-manual-tests.md`, with extra focus on the Menu and Sheet flows in `iosApp/Views/Browser/`.

## Validation Summary

| Gate | Result | Evidence |
|---|---|---|
| Build and launch | Passed | `build_run_sim` succeeded, no warnings/errors. Runtime log: `/Users/hoangnam/Library/Developer/XcodeBuildMCP/workspaces/ios-4cfafa0114e2/logs/com.lepos.lepos-app_2026-07-06T15-54-36-682Z_helperpid96512_ownerpid74502_1fc4bef3.log` |
| Unit tests via XcodeBuildMCP | Blocked | `test_sim` failed before running tests: scheme `iosApp` is not configured for `test-without-building`. Counts: passed `0`, failed `0`, skipped `0`. |
| Unit tests via direct xcodebuild | Blocked | `xcodebuild ... test -only-testing:iosAppTests/BrowserURLNormalizerTests` failed: scheme `iosApp` is not configured for the `test` action. |
| Runtime manual test | Partial pass | Core URL path loading, tab switcher menu, page settings menu, bookmarks sheet, find-in-page, privacy report, extension message, report-issue feedback, clear-data confirmation, and tab-card context menu were exercised. |

## Rechecked Fixes

| ID | Status | Result |
|---|---|---|
| BR-BUG-001/002 URL normalizer | Passed runtime for domain + path | Entering `example.com/path/q=1` loaded `Example Domain` directly instead of Google Search. Existing history still contains old pre-fix Google-search rows, so clean-state verification should clear data first. |
| BR-BUG-004 Tab switcher from menu | Passed | Bottom More -> `Tất cả các tab` navigated to tab switcher. Top tab-switcher menu opened. Sort submenu opened. |
| BR-BUG-005 Find in page | Passed basic runtime | Page Settings -> `Tìm kiếm trong trang` opened the top find bar, accepted `domain`, next/previous buttons executed, and `Xong` dismissed it cleanly. |
| BR-BUG-009 Extensions | Passed as OS-limited message | `Quản lý phần mở rộng` now shows a clear alert: iOS does not allow this app to manage Safari Extensions directly. |
| BR-BUG-010 Privacy report | Passed basic fallback | Page Details -> `Báo cáo quyền riêng tư` shows host, connection scheme, and data-store mode. This is not full Safari tracking prevention data, but no longer a silent stub. |
| BR-BUG-011 Report website issue | Passed | `Báo cáo sự cố trang web` copies page diagnostics and shows feedback alert. |
| BR-BUG-014 Tab switcher placeholders | Passed | No placeholder `Quản lý nhóm tab`, `Chọn tab`, or `Ghim Tab` items appeared in the tested menus. Tab-card context menu exposed copy, duplicate, bookmark, close others, and close tab. |
| BR-BUG-018 Current-tab navigation | Passed runtime | Search submit from Browser Search loaded the current Browser route instead of leaving the user in Search or obviously creating a new foreground tab. Source also routes through cached `BrowserViewModel.loadURLString()`. |
| BR-BUG-019 Clear data UI | Passed presentation | Bottom More shows `Xóa dữ liệu duyệt web` and opens a destructive confirmation with `Hủy` and `Xóa`. The destructive action was not confirmed in this pass to preserve test data. |

## Remaining Bugs Found

### BR-RUNTIME-001 — Unit tests cannot run from the current scheme

Severity: P1
Status: Broken
Area: Test configuration

Evidence:
- `mcp__xcodebuildmcp.test_sim` failed with `Scheme iosApp is not currently configured for the test-without-building action`.
- Direct `xcodebuild -project iosApp.xcodeproj -scheme iosApp ... test -only-testing:iosAppTests/BrowserURLNormalizerTests` also failed with `Scheme iosApp is not currently configured for the test action`.
- No Browser unit test executed, despite the test files existing under `iosAppTests/`.

Likely cause:
- The shared `iosApp` scheme does not include the `iosAppTests` target in its Test action, or the scheme is not shared/configured for testing.

Recommended fix:
- Update the `iosApp` scheme Test action to include `iosAppTests`.
- Ensure the scheme is shared so CI and XcodeBuildMCP can run it.
- Re-run full `test_sim` after the scheme is fixed.

### BR-RUNTIME-002 — Direct tap on the displayed address/title does not open address editing

Severity: P1
Status: Broken
Area: Address bar hit testing / accessibility

Evidence:
- On a loaded `Example Domain` page, tapping the displayed address/title element (`Example Domain`) did not navigate to the Browser Search screen.
- The same toolbar's More buttons were tappable, so the toolbar itself was not globally blocked.
- After tapping the address/title, runtime snapshots sometimes timed out or collapsed, while screenshots showed the page still visible.

Likely cause:
- Source has a `Button(action: openSearch)` plus `highPriorityGesture` in `BrowserAddressBar.swift`, so the issue is likely layout/accessibility hit-testing around the `UniGlass` capsule, nested buttons, or the bottom safe-area toolbar.
- The automation hit point for the address/title was reported at the very bottom edge, outside the visually centered capsule.

Recommended fix:
- Give the address-edit control a stable, independent accessibility frame and identifier.
- Avoid nesting multiple interactive controls inside the same glass capsule when the address field itself must be primary-tappable.
- Consider splitting the address field and page-settings button into separate sibling controls with explicit `accessibilityLabel`, `accessibilityIdentifier`, and fixed min height.
- Add an XCUITest that taps the address text and asserts the Browser Search text field appears.

### BR-RUNTIME-003 — Print action closes the sheet but does not show print UI or fallback

Severity: P2
Status: Broken
Area: Page Details menu

Evidence:
- Page Settings -> `Cài đặt khác...` -> `In` dismissed Page Details and returned to the web page.
- No `UIPrintInteractionController` UI appeared.
- No fallback alert appeared, even though `printPage() -> Bool` exists.

Likely cause:
- `UIPrintInteractionController.shared.present(animated:completionHandler:)` may return `true` even when Simulator does not visibly present a print UI from the current presentation context.
- Current call is delayed after sheet dismissal, but it still presents from implicit global print controller context rather than an explicit top view controller or popover anchor.

Recommended fix:
- Present print UI from a concrete foreground `UIViewController`.
- Use `present(from:in:animated:completionHandler:)` on iPad-style contexts or provide a popover source view/rect where needed.
- Add completion handler logging and user feedback when `completed == false` or `error != nil`.
- In Simulator, if printing is unavailable or invisible, show a deterministic alert instead of silently returning to the page.

### BR-RUNTIME-004 — Manual docs contain test expectations that are not fully testable via current app UI

Severity: P2
Status: Partial
Area: Test coverage / documentation

Evidence:
- `docs/browser-manual-tests.md` includes local fixture, JS dialog, popup, PDF/download, and crash-loop scenarios.
- This pass did not have an in-app deterministic fixture page available from the Browser UI.
- Unit tests were blocked by scheme configuration, so the 108-case suite is documented but not executable yet.

Likely cause:
- Manual tests describe desired coverage, but the repo still needs either XCUITest flows or a deterministic local fixture route/server integrated into the test run.

Recommended fix:
- Add a local fixture server or bundled fixture HTML route for Browser QA.
- Add XCUITest coverage for menus/sheets and WebKit-heavy behavior that unit tests cannot verify reliably.
- Keep pure logic tests in `iosAppTests`, but move DOM and UI behavior to UI tests.

## Menu And Sheet Coverage

| Flow | Result | Notes |
|---|---|---|
| Bottom More menu opens | Passed | Exposes clear data, share, add bookmark, add reading list, new tab, private tab, bookmarks, all tabs. |
| Add bookmark from More | Passed in earlier runtime loop | Shows feedback alert and persists entry. |
| Add reading list from More | Passed in earlier runtime loop | Shows feedback alert and persists entry. |
| Clear data from More | Passed presentation | Shows destructive confirmation. Destructive confirm was not executed in this pass. |
| Bookmarks sheet | Passed | Opens with Bookmark / Reading List / History tabs and search field. |
| Tab switcher top menu | Passed | History, sort submenu, copy links, add bookmarks for tabs, close all tabs are visible. |
| Tab-card context menu | Passed | Long press shows copy link, duplicate tab, bookmark, close others, close tab. Duplicate tab increased tab count from 1 to 2. |
| Page settings menu | Passed | Search/address, page details, text size, find in page, extensions, translate, report issue, hide distractions are visible. |
| Text size menu | Passed | `Cỡ chữ (100%)` opened +/- controls; increasing changed menu label to `Cỡ chữ (110%)`. |
| Find in page | Passed basic | Field accepted input and next/previous/done controls worked. |
| Page Details sheet | Partial | Privacy report works; print does not visibly present; camera/microphone rows remain informational. |
| Extensions alert | Passed OS-limited | Clear OS-limited message shown. |
| Report issue | Passed | Diagnostics copied and feedback alert shown. |

## Not Fully Covered In This Pass

- Full 108 unit tests, because the Xcode scheme cannot run the `iosAppTests` target yet.
- JavaScript alert/confirm/prompt runtime fixture.
- `target="_blank"` popup fixture.
- PDF/download handling.
- Localhost/IP fixture loading from a running deterministic server.
- Web process crash-loop retry behavior.
- Actual confirmation of destructive clear-data action.
- Private browsing history isolation after a clean data reset.

## Recommended Next Fix Order

1. Fix the Xcode scheme Test action so `iosAppTests` can run.
2. Fix address-bar hit testing and add an XCUITest for direct address editing.
3. Fix print presentation/fallback in Page Details.
4. Add deterministic Browser fixture pages for JS dialogs, popups, forms, local HTTP, PDF/download, slow load, and crash/offline scenarios.
5. Convert the most important `browser-manual-tests.md` scenarios into UI tests, especially Menu/Sheet navigation and WebKit DOM behavior.

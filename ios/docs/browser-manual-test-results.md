# Browser Manual Test Results

Date: 2026-07-06
Source checklist: `docs/browser-manual-tests.md`
Simulator: iPhone 17 Pro, `5D1EC347-ED5D-41D9-BA40-FCD65E46A9DF`
Scheme: `iosApp`

## Test Setup

| Step | Result | Evidence |
|---|---|---|
| Build and launch app | Passed | `build_run_sim` succeeded with no warnings/errors. Runtime log: `/Users/hoangnam/Library/Developer/XcodeBuildMCP/workspaces/ios-4cfafa0114e2/logs/com.lepos.lepos-app_2026-07-06T16-02-16-696Z_helperpid17076_ownerpid74502_05ed1297.log` |
| Start fixture server | Passed | Temporary in-memory HTTP server served `http://127.0.0.1:8765/index.html`. Server log showed repeated `GET /index.html 200`. |
| Fixture render in Browser | Passed | Browser loaded fixture page showing HTTPS/HTTP/JS/file/data/mailto/tel/sms/target blank/PDF/form links plus JS dialog buttons. |

## Section Results

| Manual section | Status | Tested evidence |
|---|---|---|
| Part 1: URL Normalizer | Partial pass | `127.0.0.1;8765/index.html` from iOS keyboard normalized to `http://127.0.0.1:8765/index.html` and loaded fixture. `hello world` showed Google suggestions and submitted to Google Search. |
| Part 2: Navigation Policy | Partial / blocked | HTTP fixture loaded and showed `Không an toàn`. Link-level policy tests were blocked because WKWebView links/buttons were visible in screenshot but not exposed as tappable runtime elementRefs. |
| Part 3: Persistence Store | Partial pass | After relaunch, Browser start page still showed `hello world - Google Search`, `Browser Fixture`, and `Apple` in recently/frequently viewed sections. |
| Part 4: Tab Management | Blocked in this pass | Bottom More tap on the fixture page caused runtime snapshot collapse to `count=1`; menu did not open in the captured screenshot, so tab actions could not be reliably retested from this page. |
| Part 5: Per-tab WebKit behavior | Partial pass / blocked | Fixture page rendered, HTTP warning displayed, Google Search navigation worked. Link/button cases for JS alert, popup, PDF, form, external schemes were blocked by WKWebView element exposure. |
| Part 6: Website data manager | Not executed | Destructive clear-data action was not executed in this pass. |
| Part 7: Favicon cache | Not executed | GitHub favicon multi-tab scenario was not executed in this pass. |
| Part 8: Data models | Not executable manually | Requires unit tests or internal state assertions; current scheme test action remains blocked from prior validation. |

## Passed Test Cases

| ID | Result | Notes |
|---|---|---|
| TC-1.1.4 | Passed | Typing `hello world` produced Google suggestions and navigated to Google Search. |
| TC-1.3.1 | Passed | Typing `127.0.0.1:8765/index.html` through the simulator keyboard became `127.0.0.1;8765/index.html`, then Browser normalized it to HTTP localhost and loaded the fixture. |
| TC-1.5.1 | Passed | The semicolon-to-colon keyboard normalization path worked for `127.0.0.1;8765/index.html`. |
| TC-2.1.2 | Passed | HTTP fixture displayed a visible `Không an toàn` indicator in the address bar. |
| TC-3.8.1 | Passed basic | Start page showed recently viewed entries after relaunch. |
| TC-3.9.2 | Passed basic | Frequently viewed section rendered domain tiles and did not exceed the visible section limit. |
| TC-3.22.1 | Passed basic | Browsing data survived app stop/relaunch. |
| TC-4.15.1 | Passed | Typing `hello world` showed Google suggestion rows under the search field. |
| TC-5.26.1 / TC-5.27.1 | Passed basic | Page title/address updated after fixture and Google navigation; loading settled into a page state with toolbar controls. |

## Bugs Found In This Pass

### BR-MANUAL-001 — Menu actions can collapse runtime accessibility snapshots

Severity: P1
Status: Reproduced
Area: Browser menu / accessibility / UI automation

Evidence:
- On Google Search, tapping Page Settings -> `Tìm kiếm hoặc nhập địa chỉ` returned a runtime snapshot with `count=1`, while screenshot showed the page settings menu still visible.
- On the local fixture page, tapping the bottom More button also returned a runtime snapshot with `count=1`; screenshot showed the Browser page still visible and no menu opened.

Likely cause:
- Browser uses layered SwiftUI menus over a `WKWebView` plus a custom bottom toolbar. The visible UI remains alive, but the runtime accessibility tree becomes unavailable or stale after some menu transitions.
- Some bottom toolbar elementRefs report tap coordinates at the screen bottom edge, which suggests the accessibility frame does not match the visual button frame.

Recommended fix:
- Add explicit `accessibilityIdentifier` and stable frames for Browser toolbar controls.
- Split the address/page settings/bottom More controls into non-overlapping hit regions.
- Avoid presenting SwiftUI `Menu` from controls whose accessibility frame overlaps the home indicator or WKWebView.
- Add XCUITest coverage for Page Settings -> Search, bottom More -> menu open, and bottom More -> All Tabs.

### BR-MANUAL-002 — WKWebView fixture links are visible but not tappable through runtime snapshot

Severity: P2
Status: Blocked test coverage
Area: Web content accessibility / UI automation

Evidence:
- Screenshot confirmed fixture links and JS buttons were visible: `javascript link`, `file link`, `data link`, `mailto link`, `tel link`, `sms link`, `target blank`, `pdf fixture`, `form fixture`, and alert/confirm/prompt buttons.
- Runtime snapshots exposed Browser chrome, but not individual web-page links/buttons as tappable `elementRef`s.

Likely cause:
- The current runtime snapshot tooling does not expose this WKWebView DOM as individual tappable targets, or the app's WKWebView accessibility configuration does not make web content available to the snapshot layer.

Recommended fix:
- Add UI tests that can tap web content by coordinate or use a WebKit test harness.
- Alternatively, add a native Browser QA fixture screen that calls the same Browser navigation APIs for JS/popup/external/PDF cases.
- Verify VoiceOver/web accessibility separately if this limitation also affects real accessibility, not only automation.

### BR-MANUAL-003 — Search field replacement is unreliable under automation

Severity: P3
Status: Observed
Area: Browser Search / automation ergonomics

Evidence:
- `type_text(..., replaceExisting: true)` inserted `hello world` into the middle of the prefilled URL (`http://127.0.0.1:8765hello world/index.html`) instead of replacing it.
- Using the visible Clear Text button first made input work correctly.

Likely cause:
- SwiftUI `.searchable` / search text field selection state is not fully selected when the automation attempts replacement.

Recommended fix:
- On entering Browser Search, explicitly select all text or provide a deterministic clear state for editing.
- Add an XCUITest assertion that opening Search with an existing URL allows replacing the entire address in one typing action.

## Blocked Or Not Covered Cases

| Test group | Reason |
|---|---|
| `javascript:`, `file:`, `data:` link policy | Fixture links visible but not exposed as tappable web elements; subsequent Search menu transition caused AX collapse. |
| `mailto:`, `tel:`, `sms:`, `itms-apps`, custom scheme | Same WebView element exposure limitation. |
| `target="_blank"` popup | Same WebView element exposure limitation. |
| JS alert/confirm/prompt buttons | Same WebView element exposure limitation. |
| PDF fixture | Same WebView element exposure limitation. |
| Form input fixture | Same WebView element exposure limitation. |
| More menu tab actions after fixture page | Bottom More interaction collapsed the runtime snapshot; menu did not open in screenshot. |
| Clear website data confirmation execution | Not executed to avoid destructive data loss during this pass. |
| Crash-loop retry behavior | Requires controlled WebKit process termination; not exercised manually. |
| Favicon concurrency | Requires network/log instrumentation or unit/UI test support; not exercised manually. |
| Data model encode/decode | Requires unit tests; not a manual UI scenario. |

## Recommendations

1. Fix Browser menu accessibility/hit regions before expanding manual QA. It blocks reliable testing of many Menu and Sheet flows.
2. Add a dedicated XCUITest target or fix the existing scheme test action so the documented 108 tests can execute.
3. Add a deterministic web fixture strategy for WKWebView tests: either coordinate-based UI automation, native QA controls, or a WebKit test harness.
4. Keep the local fixture from this pass conceptually: it covers HTTP, data image, unsafe links, external schemes, target blank, PDF, form, and JS dialogs in one page.
5. After fixing `BR-MANUAL-001`, rerun Parts 2, 4, 5, 6, and 7 because they are currently under-covered by runtime blockers.

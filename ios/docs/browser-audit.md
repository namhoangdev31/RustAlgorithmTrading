# Browser Safari-Parity Audit

Date: 2026-07-06  
Scope: `iosApp/Views/Browser/`, `iosApp/Coordinators/`, Browser dependency wiring only  
Simulator: iPhone 17 Pro, iOS 26.5, `5D1EC347-ED5D-41D9-BA40-FCD65E46A9DF`  
Project: `iosApp.xcodeproj`, scheme `iosApp`, bundle `com.lepos.lepos-app`

## Summary

The Browser feature is not Safari-stable yet. It can open basic websites, persist history/bookmarks/reading-list entries, create new tabs, and keep private browsing out of normal history in the tested case. However, several Safari-labeled controls are stubs, the omnibox misclassifies common URL shapes, WebKit entered repeated process crash handling during URL/search testing, tab-switcher entry was unreliable from the More menu, and several menus/sheets have accessibility or overlap issues.

This pass did not change Swift source. It clean-installed the app on the connected simulator, ran the app, exercised Browser UI flows, checked app data files, and compared the current behavior to Apple's iPhone Safari guide.

## Safari Baseline Sources

- [Browse the web using Safari on iPhone](https://support.apple.com/guide/iphone/browse-the-web-iph1fbef4daa/ios)
- [Customize your Safari settings on iPhone](https://support.apple.com/guide/iphone/customize-your-safari-settings-iphb3100d149/ios)
- [Browse the web privately in Safari on iPhone](https://support.apple.com/guide/iphone/browse-the-web-privately-iphb01fc3c85/ios)
- [Organize your tabs with Tab Groups in Safari on iPhone](https://support.apple.com/guide/iphone/organize-your-tabs-with-tab-groups-iph3028ebf68/ios)
- [Change the layout in Safari on iPhone](https://support.apple.com/guide/iphone/change-the-layout-ipha9ffea1a3/ios)
- [Save webpages to read later in Safari on iPhone](https://support.apple.com/guide/iphone/save-pages-to-a-reading-list-iph1a4721132/ios)
- [Get extensions to customize Safari on iPhone](https://support.apple.com/guide/iphone/get-extensions-iphab0432bf6/ios)
- [Clear your cache and cookies on iPhone](https://support.apple.com/guide/iphone/clear-your-cache-and-cookies-iphacc5f0202/ios)
- [Digital certificates and encrypted websites in Safari on iPhone](https://support.apple.com/guide/iphone/digital-certificates-and-encrypted-websites-iph1b914c6d4/ios)

## Evidence Collected

- Clean app reinstall: `xcrun simctl uninstall 5D1EC347-ED5D-41D9-BA40-FCD65E46A9DF com.lepos.lepos-app`, then `build_run_sim`.
- Build result: succeeded, no errors.
- Build warnings: 12 empty `NS*UsageDescription` values, including Microphone, Location, Photos, Face ID, Bluetooth, Contacts, User Tracking, and others.
- Runtime logs:
  - Build log: `/Users/hoangnam/Library/Developer/XcodeBuildMCP/workspaces/ios-4cfafa0114e2/logs/build_run_sim_2026-07-06T10-07-24-033Z_pid47119_e35263bf.log`
  - Runtime log with crash loop: `/Users/hoangnam/Library/Developer/XcodeBuildMCP/workspaces/ios-4cfafa0114e2/logs/com.lepos.lepos-app_2026-07-06T10-07-45-009Z_helperpid61440_ownerpid47119_b3004c0d.log`
  - Later runtime logs: `.../com.lepos.lepos-app_2026-07-06T10-10-14-976Z_helperpid64361_ownerpid47119_aa8037cc.log`, `.../com.lepos.lepos-app_2026-07-06T10-13-11-891Z_helperpid66652_ownerpid47119_1cc51171.log`, `.../com.lepos.lepos-app_2026-07-06T10-16-06-976Z_helperpid68163_ownerpid47119_64df3f0f.log`
- Screenshots:
  - Onboarding clean install: `/var/folders/h9/_37f97bx28q57hg0p4dlwxcc0000gn/T/screenshot_optimized_55554542-7b51-49d9-b6c7-bbe723a3b4cf.jpg`
  - Apple page with Browser toolbar: `/var/folders/h9/_37f97bx28q57hg0p4dlwxcc0000gn/T/screenshot_optimized_cc886764-7afe-40c0-b0d9-b5969558babc.jpg`
  - Apple page after toolbar collapse: `/var/folders/h9/_37f97bx28q57hg0p4dlwxcc0000gn/T/screenshot_optimized_378447e9-8e50-4842-8be9-d57cb8e23586.jpg`
  - More menu stuck after All Tabs tap: `/var/folders/h9/_37f97bx28q57hg0p4dlwxcc0000gn/T/screenshot_optimized_7e7b8a56-e8bb-4ed6-987d-a283b92abe8d.jpg`
  - Find-in-page overlapped by floating menu: `/var/folders/h9/_37f97bx28q57hg0p4dlwxcc0000gn/T/screenshot_optimized_42129712-b2bd-4ca1-89d4-c11d8a62f69c.jpg`
- Persistence verified in simulator data container:
  - `Library/Application Support/Browser/browser_history.json`
  - `Library/Application Support/Browser/browser_bookmarks.json`
  - `Library/Application Support/Browser/browser_reading_list.json`
  - `Library/Application Support/Browser/browser_search_queries.json`

## Runtime Findings

| ID | Severity | Status | Area | Finding | Evidence |
|---|---:|---|---|---|---|
| BR-BUG-001 | P1 | Broken | Omnibox URL parsing | `example.com/path...` and `127.0.0.1:8765/index.html` were treated as Google searches instead of direct navigation. Safari treats name/address input as a real address when it looks like one. | Runtime produced `www.google.com` and persisted `https://www.google.com/search?q=example.com/path/foo%3Dbar`; source only accepts bare domains in `BrowserURLNormalizer.swift:26-47`. |
| BR-BUG-002 | P1 | Broken | Local/dev URL support | The deterministic fixture server at `http://127.0.0.1:8765` was reachable from macOS, but the Browser UI could not infer or load `127.0.0.1:8765/index.html` without a scheme. This blocked local form/PDF/popup/dialog fixture coverage from the Browser UI. | Runtime search history saved `127.0.0.1;8765/index.html`; source does not recognize IP/port/path without explicit scheme. |
| BR-BUG-003 | P0 | Broken | Web process stability | During URL/search testing, WebKit repeatedly terminated and Browser repeatedly reloaded/marked crashed. | Runtime log repeatedly printed `Web process terminated - reloading` and `Web process crashed repeatedly - halting`; handling is in `BrowserTabViewModel.swift:218-230`. |
| BR-BUG-004 | P1 | Broken | Tab switcher | Tapping More -> `Tất cả các tab` did not reach tab switcher in the tested run; the More menu remained open and accessibility snapshot collapsed to `count=1`. | Screenshot `screenshot_optimized_7e7b8a56...jpg`; UI action after `e65` timed out. |
| BR-BUG-005 | P1 | Broken | Find in page | Find bar opens, accepts text, and has up/down controls, but tapping `Xong` repeatedly opened/overlapped the floating assistive menu instead of closing the find UI cleanly. | Screenshot `screenshot_optimized_42129712...jpg`; find controls from `BrowserView.swift:22-51`. |
| BR-BUG-006 | P2 | Broken | Accessibility / automation | SwiftUI menu transitions sometimes returned an empty runtime accessibility snapshot (`count=1`) after selecting search/tab-switcher actions. | Reproduced after `Tìm kiếm hoặc nhập địa chỉ` and `Tất cả các tab`; screenshots showed UI still present while snapshot was empty. |
| BR-BUG-007 | P2 | Partial | Address bar UX | Tapping the displayed address does not focus/edit directly; it opens a page menu, and the user must choose `Tìm kiếm hoặc nhập địa chỉ`. Safari's address field is directly editable. | Runtime: tap address opened `BrowserPageSettingsMenuView`; direct search target was a menu item. |
| BR-BUG-008 | P1 | Broken | JavaScript dialogs | `alert`, `confirm`, and `prompt` are auto-dismissed instead of shown to the user. This breaks many web apps. | Source: `BrowserTabViewModel.swift:240-242`. |
| BR-BUG-009 | P2 | Stub | Extensions | `Quản lý phần mở rộng` only shows an alert saying the feature will be supported later. | Runtime alert confirmed; source: `BrowserPageSettingsMenuView.swift:37-40`. |
| BR-BUG-010 | P2 | Stub | Privacy report | `Báo cáo quyền riêng tư` only dismisses the sheet and does not show tracking/privacy data. | Runtime confirmed; source: `BrowserPageDetailsMenuView.swift:11-22`. |
| BR-BUG-011 | P2 | Stub | Website issue report | `Báo cáo sự cố trang web` has an empty action. | Runtime dismissed/no flow; source: `BrowserPageSettingsMenuView.swift:25-29`. |
| BR-BUG-012 | P2 | Stub | Print | `In` only dismisses the page details sheet; no print controller is presented. | Source: `BrowserPageDetailsMenuView.swift:47-51`. |
| BR-BUG-013 | P2 | Stub | Favorites | `Thêm vào Mục ưa thích` only dismisses; it does not add a favorite distinct from bookmarks. | Source: `BrowserPageDetailsMenuView.swift:64-68`. |
| BR-BUG-014 | P2 | Stub | Tab groups / multi-select / pin | Tab group management and multi-select are placeholders; pin tab and tab-card sort submenu actions are empty. | Source: `BrowserTabSwitcherView.swift:88-99` and `BrowserTabSwitcherView.swift:388-408`. |
| BR-BUG-015 | P2 | Partial | Translation | Translation works by navigating the current tab to Google Translate proxy (`www-apple-com.translate.goog`), not an in-place Safari-style translation action. | Runtime confirmed; source: `BrowserTabViewModel.swift:146-150`. |
| BR-BUG-016 | P2 | Partial | Private browsing UI | Opening a private tab did not expose a clear private-mode indicator on the main Browser/start page. The tested private Google navigation did not add history, so data isolation partly works. | Runtime + history file count stayed at 3 after private Google load; `BrowserTabSwitcherView` owns the visible private segment. |
| BR-BUG-017 | P1 | Risk | Private/history correctness | History filtering uses global `viewModel.isPrivateMode` instead of the tab's own `tab.isPrivate`, which risks wrong history writes when active mode and tab privacy diverge. | Source: `BrowserViewModel.swift:156-158`. |
| BR-BUG-018 | P1 | Broken | Current-tab navigation | Submitting a URL/search while a tab already has `currentURL` creates a new tab instead of navigating the current tab. Safari navigates the focused tab unless the user explicitly opens a new tab. | Source: `BrowserViewModel.swift:101-107`; runtime produced new start-page tab from More -> Tab mới and source confirms submit behavior. |
| BR-BUG-019 | P2 | Missing | Clear data UI | `clearWebsiteData()` exists but no Browser menu/screen exposed it in the tested UI. Safari exposes clear history/cache/cookies flow. | Source: `BrowserViewModel.swift:135-140`; no runtime menu item found. |
| BR-BUG-020 | P1 | Broken | Permission readiness | Build warns that permission usage descriptions are empty, while Browser page settings display Camera/Microphone rows. Real camera/mic permission prompts are not production-ready. | Build warnings; source rows in `BrowserPageDetailsMenuView.swift:77-89`. |
| BR-BUG-021 | P2 | Partial | Reading List | Add/view/delete basics work, but there is no read/unread state, offline save, or real page preview extraction; preview text is generic. | Runtime + `browser_reading_list.json`. |
| BR-BUG-022 | P2 | Partial | Bookmarks | Add/view/delete basics work, but folder rows are static and there is no edit/rename/move flow. | Runtime + `BrowserBookmarksView`; `Nhóm tab ưa thích` row has no management flow. |
| BR-BUG-023 | P2 | Partial | Hide distractions | The action injects CSS selectors for ads/popups only. It is not equivalent to Safari's distraction control or reader cleanup. | Source: `BrowserTabViewModel.swift:136-143`. |
| BR-BUG-024 | P2 | Partial | Desktop site | Desktop site uses a hard-coded macOS Safari user agent and reload. It has no per-site persistence or richer Safari site settings. | Source: `BrowserTabViewModel.swift:165-170`. |
| BR-BUG-025 | P2 | Missing | HTTP/certificate UI | The address bar does not expose a visible `Not Secure`/certificate detail state comparable to Safari. | Source shows `isSecureURL` exists in `BrowserAddressBar.swift` but no lock/not-secure UI uses it. |
| BR-BUG-026 | P2 | Partial | Web content accessibility | Web page content was weakly represented in runtime snapshots; Apple/Google pages mostly exposed toolbar/address text and sparse web text. | Runtime snapshots after loading Apple/Google. |

## Safari Parity Gap Matrix

| ID | Severity | Status | Safari capability | Browser state |
|---|---:|---|---|---|
| BR-GAP-001 | P1 | Missing | Safari Profiles with separate history/extensions/settings | No profiles model or UI found. |
| BR-GAP-002 | P1 | Missing | Real Tab Groups: create, rename, move tabs, pin tabs, share/collaborate | UI labels exist, but major actions are placeholder/no-op. |
| BR-GAP-003 | P2 | Missing | iCloud sync for open tabs/bookmarks/history/reading list | Safari-only / OS-limited unless a custom sync design is added. |
| BR-GAP-004 | P2 | Missing | Locked Private Browsing with Face ID/passcode | No lock/unlock private browsing flow. |
| BR-GAP-005 | P2 | Missing | Safari extension ecosystem and per-site extension controls | Stub alert only. |
| BR-GAP-006 | P2 | Missing | Reader view and Listen to Page | No reader extraction/listen flow; only CSS-based distraction hiding. |
| BR-GAP-007 | P2 | Missing | Link preview long-press actions: open, open in new tab/group, download linked file, add to reading list | Not implemented in `WKUIDelegate`/gesture UI. |
| BR-GAP-008 | P2 | Missing | Downloads manager, PDF download, PDF annotation/Markup | Local fixture PDF could not be reached from UI; no downloads UI found. |
| BR-GAP-009 | P2 | Missing | Form AutoFill, passkeys, Hide My Email, saved passwords integration | Not implemented in Browser UI. Some behavior may be OS/WebKit-provided, but no app parity surface exists. |
| BR-GAP-010 | P2 | Missing | HTTP warnings, certificate details, verify website encryption | No visible certificate/security detail UI. |
| BR-GAP-011 | P2 | Missing | Start page customization: sections, background, cross-device start page | Start page is hard-coded favorites plus computed history/bookmark sections. |
| BR-GAP-012 | P2 | Missing | Safari layout modes: Compact, Bottom, Top | One custom bottom toolbar layout only. |
| BR-GAP-013 | P3 | Missing | Import/export Safari data | No import/export UI or storage contract. |
| BR-GAP-014 | P3 | Missing | Shared With You / suggestions from Messages/Mail/Calendar | No integration found. |
| BR-GAP-015 | P3 | Missing | Search engine selection and private search engine | Google is hard-coded in normalizer and suggestions. |
| BR-GAP-016 | P3 | Missing | Recently closed tabs, restore closed tabs, cross-device tabs | No restored-tab model found. |

## Tested Scenario Results

| Scenario | Result |
|---|---|
| Clean install and launch | Working after onboarding; Browser start page appears on first tab. |
| Favorite navigation | Working for Apple; loaded `www.apple.com`. |
| Bare domain/search input | Partial; basic search works, but URL-like paths become Google searches. |
| URL with path/query | Broken; `example.com/path...` became Google search. |
| Local fixture URL with IP/port/path | Broken without explicit scheme; blocked deterministic fixture coverage. |
| Back/forward/reload | Partial; controls are present and reload is available. |
| Scroll toolbar collapse | Working, but toolbar fully disappears while scrolling and relies on reverse scroll to return. |
| Bookmarks | Working basic add/view/persist; edit/folder management missing. |
| Reading List | Working basic add/view/persist; offline/read-state missing. |
| History | Working basic persistence; private-mode logic has source-level risk. |
| Private tab | Partial; tested navigation did not write history, but UI indicator is weak outside tab switcher. |
| New tab | Working from More menu. |
| Tab switcher | Broken/unreliable from More menu in runtime automation. |
| Find in page | Broken/partial; opens but close action overlaps floating menu and match count is missing. |
| Page details | Partial; sheet opens but several actions are stubs. |
| Extensions | Stub. |
| Privacy report | Stub. |
| Website issue report | Stub. |
| Print | Stub. |
| Translate | Partial Google Translate proxy. |
| JavaScript dialogs | Broken by source: auto-dismissed. |
| Camera/mic site settings | Missing real behavior and build permission strings are empty. |
| Clear cache/cookies/history | Missing UI exposure. |
| PDF/download/forms/popup fixture pages | Not runtime-tested because the Browser UI could not load the local fixture URL shape; source indicates popups create new tabs but JS dialogs are broken. |

## Recommended Fix Order

1. Fix the omnibox and current-tab navigation contract first: support IP/port/path, bare domains with paths, explicit schemes, and navigating the active tab unless the user asks for a new tab.
2. Stabilize WebKit process handling and stop reload loops; collect the actual WebKit termination reason before automatically reloading.
3. Make tab switcher entry reliable and finish core tab management before adding Safari-style labels.
4. Replace stubbed page actions with real flows or hide them until implemented.
5. Fix find-in-page overlay placement and dismiss behavior, especially with the floating assistive control enabled.
6. Add security/privacy UI: not-secure indicator, certificate/page info, real privacy report state, and usable clear-data controls.
7. Complete persistence semantics: private tab state, reading list offline/read state, bookmark folders/editing, start page customization.
8. Add WebKit dialog handling, permission prompts with non-empty usage descriptions, downloads/PDF handling, and form/autofill expectations.

## Notes

- The app worktree already had uncommitted Browser/Coordinator/WebRuntime changes before this audit. This report reflects the current working tree and simulator behavior on 2026-07-06.
- The temporary fixture server ran at `http://127.0.0.1:8765`, but Browser UI could not load the no-scheme IP/port/path input. The fixture remains useful after omnibox fixes for deterministic form, popup, PDF, and JavaScript dialog regression tests.

# Browser — Danh mục chức năng & Kế hoạch Test

> **Phạm vi**: `iosApp/Views/Browser/`  
> **Cập nhật**: 2026-07-06  
> **Mục đích**: Liệt kê **tất cả chức năng đang CÓ**, function thực thi, và test case tương ứng.

---

## 1. URL Normalizer

**File**: `BrowserURLNormalizer.swift`

| # | Chức năng | Function | Có |
|---|---|---|---|
| 1.1 | Normalize input text → URL hoặc Google search | `normalize(_ input: String) -> URL?` | ✅ |
| 1.2 | Block dangerous schemes (javascript, file, data) | `normalize()` — internal check | ✅ |
| 1.3 | Nhận diện IP/localhost/domain + port + path | `normalize()` — `isLikelyAuthority()` | ✅ |
| 1.4 | Percent-encoding fallback khi URL(string:) thất bại | `normalize()` — `percentEncodeFallback()` | ✅ |
| 1.5 | Keyboard `;` → `:` normalization | `normalize()` — `replacingOccurrences` | ✅ |
| 1.6 | Redact URL cho logging | `static redactURLForLogging(_ url: URL) -> String` | ✅ |

### Test Cases — `BrowserURLNormalizerTests`

```
TC-1.1.1  normalize("https://example.com")         → URL "https://example.com"
TC-1.1.2  normalize("example.com")                  → URL "https://example.com"
TC-1.1.3  normalize("example.com/path?q=1")         → URL "https://example.com/path?q=1"
TC-1.1.4  normalize("hello world")                  → Google search URL chứa "hello+world"
TC-1.1.5  normalize("")                             → nil
TC-1.1.6  normalize("   ")                          → nil
TC-1.2.1  normalize("javascript:alert(1)")          → Google search (không phải JS URL)
TC-1.2.2  normalize("file:///etc/passwd")           → Google search (blocked)
TC-1.2.3  normalize("data:text/html,<h1>hi</h1>")  → Google search (blocked)
TC-1.3.1  normalize("127.0.0.1:8765/index.html")   → URL "http://127.0.0.1:8765/index.html"
TC-1.3.2  normalize("localhost:3000")               → URL "http://localhost:3000"
TC-1.3.3  normalize("192.168.1.1")                  → URL "http://192.168.1.1"
TC-1.3.4  normalize("::1")                          → URL "http://[::1]"
TC-1.4.1  normalize("example.com/path with spaces") → URL with percent-encoded path
TC-1.4.2  normalize("example.com/path?q=a&b=c#frag") → URL preserving query + fragment
TC-1.5.1  normalize("127.0.0.1;8765")              → URL "http://127.0.0.1:8765"
TC-1.6.1  redactURLForLogging(URL("https://x.com/path?token=abc")) → redacted string
```

---

## 2. Navigation Policy

**File**: `BrowserNavigationPolicy.swift`

| # | Chức năng | Function | Có |
|---|---|---|---|
| 2.1 | Quyết định allow/block/external cho URL | `decidePolicy(for: URL, isMainFrame: Bool) -> BrowserNavigationDecision` | ✅ |
| 2.2 | Block file/javascript/data schemes | — nằm trong `decidePolicy()` | ✅ |
| 2.3 | Allow http/https/about:blank | — nằm trong `decidePolicy()` | ✅ |
| 2.4 | Redirect mailto/tel/sms/maps/itms-apps ra external | — nằm trong `decidePolicy()` | ✅ |

### Test Cases — `BrowserNavigationPolicyTests`

```
TC-2.1.1  decidePolicy("https://apple.com", mainFrame=true)      → .allow
TC-2.1.2  decidePolicy("http://example.com", mainFrame=true)     → .allow
TC-2.1.3  decidePolicy("about:blank", mainFrame=true)            → .allow
TC-2.2.1  decidePolicy("javascript:alert(1)", mainFrame=true)    → .blocked(.unsafeScheme)
TC-2.2.2  decidePolicy("file:///etc/hosts", mainFrame=true)      → .blocked(.unsafeScheme)
TC-2.2.3  decidePolicy("data:text/html,...", mainFrame=true)      → .blocked(.unsafeScheme)
TC-2.2.4  decidePolicy("data:image/png;...", mainFrame=false)     → .allow (subframe OK)
TC-2.4.1  decidePolicy("mailto:test@a.com", mainFrame=true)      → .openExternal
TC-2.4.2  decidePolicy("tel:+84123456789", mainFrame=true)       → .openExternal
TC-2.4.3  decidePolicy("sms:+84123", mainFrame=true)             → .openExternal
TC-2.4.4  decidePolicy("itms-apps://itunes.apple.com/...", mainFrame=true) → .openExternal
TC-2.4.5  decidePolicy("custom-scheme://x", mainFrame=true)      → .openExternal
```

---

## 3. Persistence Store

**File**: `BrowserPersistenceStore.swift`

| # | Chức năng | Function | Có |
|---|---|---|---|
| 3.1 | Thêm history item | `addHistoryItem(url:title:isPrivate:)` | ✅ |
| 3.2 | Private mode không ghi history | `addHistoryItem()` — `guard !isPrivate` | ✅ |
| 3.3 | Chống trùng URL liên tiếp | `addHistoryItem()` — dedup logic | ✅ |
| 3.4 | Giới hạn 1000 items | `addHistoryItem()` — `prefix(1000)` | ✅ |
| 3.5 | Auto-extract Google search query | `addHistoryItem()` → `addSearchQuery()` | ✅ |
| 3.6 | Xóa tất cả history | `clearHistory()` | ✅ |
| 3.7 | Xóa 1 history item | `removeHistoryItem(id:)` | ✅ |
| 3.8 | Vừa xem (top 8 unique domains) | `var recentlyViewed` | ✅ |
| 3.9 | Thường xuyên (top 8 by visit count) | `var frequentlyVisited` | ✅ |
| 3.10 | Thêm bookmark | `addBookmark(url:title:)` | ✅ |
| 3.11 | Chống trùng bookmark | `addBookmark()` — dedup check | ✅ |
| 3.12 | Xóa bookmark | `removeBookmark(id:)` | ✅ |
| 3.13 | Xóa tất cả bookmarks | `clearBookmarks()` | ✅ |
| 3.14 | Thêm reading list item | `addReadingListItem(url:title:)` | ✅ |
| 3.15 | Chống trùng reading list | `addReadingListItem()` — dedup check | ✅ |
| 3.16 | Xóa reading list item | `removeReadingListItem(id:)` | ✅ |
| 3.17 | Xóa tất cả reading list | `clearReadingList()` | ✅ |
| 3.18 | Thêm search query | `addSearchQuery(_:)` | ✅ |
| 3.19 | Search query dedup + bring to top | `addSearchQuery()` — dedup logic | ✅ |
| 3.20 | Giới hạn 100 search queries | `addSearchQuery()` — `prefix(100)` | ✅ |
| 3.21 | Xóa tất cả search queries | `clearSearchQueries()` | ✅ |
| 3.22 | Persist/load từ JSON file | `saveHistory()/loadHistory()` + tương tự cho bookmarks, reading list, queries | ✅ |

### Test Cases — `BrowserPersistenceStoreTests`

```
TC-3.1.1  addHistoryItem → history.count == 1, URL + title đúng
TC-3.1.2  addHistoryItem 2 lần cùng URL → history.count == 1 (dedup)
TC-3.1.3  addHistoryItem 2 URL khác nhau → history.count == 2
TC-3.2.1  addHistoryItem(isPrivate: true) → history.count == 0
TC-3.3.1  addHistoryItem("a.com") rồi addHistoryItem("b.com") rồi addHistoryItem("a.com") → history[0].url == "a.com"
TC-3.4.1  Thêm 1001 items → history.count == 1000
TC-3.5.1  addHistoryItem(url: "https://www.google.com/search?q=test+query") → searchQueries chứa "test query"
TC-3.6.1  clearHistory() → history.isEmpty == true
TC-3.7.1  removeHistoryItem(id: item.id) → item bị xóa, items khác còn
TC-3.8.1  Thêm 10 history items từ 5 domains → recentlyViewed.count <= 8, unique by domain
TC-3.9.1  Thêm nhiều visits cho domain "a.com" → frequentlyVisited[0].domain == "a.com"
TC-3.9.2  frequentlyVisited.count <= 8
TC-3.10.1 addBookmark("https://x.com", "X") → bookmarks.count == 1
TC-3.11.1 addBookmark cùng URL 2 lần → bookmarks.count == 1
TC-3.12.1 removeBookmark(id:) → item bị xóa
TC-3.13.1 clearBookmarks() → bookmarks.isEmpty == true
TC-3.14.1 addReadingListItem → readingList.count == 1, domain được extract
TC-3.15.1 addReadingListItem cùng URL 2 lần → readingList.count == 1
TC-3.16.1 removeReadingListItem(id:) → item bị xóa
TC-3.17.1 clearReadingList() → readingList.isEmpty == true
TC-3.18.1 addSearchQuery("test") → searchQueries == ["test"]
TC-3.19.1 addSearchQuery("a") rồi addSearchQuery("b") rồi addSearchQuery("a") → searchQueries[0] == "a"
TC-3.20.1 Thêm 101 queries → searchQueries.count == 100
TC-3.21.1 clearSearchQueries() → searchQueries.isEmpty == true
TC-3.22.1 Tạo store, thêm data, tạo store mới từ cùng directory → data vẫn còn
```

---

## 4. Tab Management

**File**: `BrowserViewModel.swift`

| # | Chức năng | Function | Có |
|---|---|---|---|
| 4.1 | Tạo tab mới | `createNewTab(initialURL:isPrivate:)` | ✅ |
| 4.2 | Đóng tab | `closeTab(id:)` | ✅ |
| 4.3 | Đóng tab khác | `closeOtherTabs(keepingId:)` | ✅ |
| 4.4 | Đóng tất cả tab | `closeAllTabs(isPrivate:)` | ✅ |
| 4.5 | Nhân đôi tab | `duplicateTab(_:)` | ✅ |
| 4.6 | Chuyển tab | `switchTab(to:)` | ✅ |
| 4.7 | Active tab computed property | `var activeTab: BrowserTabViewModel?` | ✅ |
| 4.8 | Load URL string | `loadURLString(_:forceNewTab:)` | ✅ |
| 4.9 | Handle external navigation | `handleExternalNavigation(initialURL:isPrivate:)` | ✅ |
| 4.10 | Thêm bookmark từ active tab | `addCurrentToBookmarks()` | ✅ |
| 4.11 | Thêm reading list từ active tab | `addCurrentToReadingList()` | ✅ |
| 4.12 | Xóa dữ liệu web | `clearWebsiteData()` | ✅ |
| 4.13 | Reset browser state | `reset()` | ✅ |
| 4.14 | Sync address bar text | `syncAddressBar()` | ✅ |
| 4.15 | Fetch Google suggestions | `fetchGoogleSuggestions(_:)` | ✅ |

### Test Cases — `BrowserViewModelTests`

```
TC-4.1.1  createNewTab(isPrivate: false) → tabs.count == 2 (1 default + 1 new), activeTab != nil
TC-4.1.2  createNewTab(initialURL: URL, isPrivate: false) → activeTab.currentURL == URL
TC-4.1.3  createNewTab(isPrivate: true) → activeTab.isPrivate == true, isPrivateMode == true
TC-4.2.1  closeTab(chỉ còn 1 tab) → tự tạo tab trống mới, tabs.count == 1
TC-4.2.2  closeTab(có 2 tab, đóng active) → activeTabId chuyển sang tab còn lại
TC-4.2.3  closeTab(có 2 tab, đóng inactive) → activeTabId không đổi
TC-4.3.1  3 tabs, closeOtherTabs(keepingId: tab2) → tabs.count == 1, activeTabId == tab2.id
TC-4.4.1  closeAllTabs(isPrivate: false) → tất cả normal tabs bị xóa, tạo 1 tab trống mới
TC-4.4.2  closeAllTabs(isPrivate: true) → chỉ xóa private tabs, normal tabs giữ nguyên
TC-4.5.1  duplicateTab(tab) → tabs.count tăng 1, tab mới có cùng currentURL
TC-4.6.1  switchTab(to: id) → activeTabId == id
TC-4.6.2  switchTab(to: invalidId) → activeTabId không đổi
TC-4.7.1  activeTab với tabs rỗng → nil
TC-4.7.2  activeTab với activeTabId hợp lệ → trả về đúng tab
TC-4.8.1  loadURLString("https://x.com") → activeTab.currentURL hợp lệ
TC-4.8.2  loadURLString("hello world") → activeTab loads Google search
TC-4.8.3  loadURLString("", forceNewTab: true) → ??? (edge case)
TC-4.10.1 addCurrentToBookmarks() khi activeTab có URL → bookmark được thêm + message hiện
TC-4.10.2 addCurrentToBookmarks() khi activeTab không có URL → không thêm
TC-4.11.1 addCurrentToReadingList() khi activeTab có URL → reading list item được thêm
TC-4.12.1 clearWebsiteData() → history + search queries cleared, message hiện
TC-4.13.1 reset() → tabs.count == 1, isToolbarCollapsed == false, showFindInPage == false
TC-4.14.1 syncAddressBar() khi activeTab có URL → urlInputText == URL string
TC-4.14.2 syncAddressBar() khi activeTab nil → urlInputText == ""
TC-4.15.1 fetchGoogleSuggestions("") → googleSuggestions == []
TC-4.15.2 fetchGoogleSuggestions("https://example.com") → googleSuggestions == [] (URL, không search)
```

---

## 5. Tab ViewModel (Per-Tab)

**File**: `BrowserTabViewModel.swift`

| # | Chức năng | Function | Có |
|---|---|---|---|
| 5.1 | Load URL với policy check | `load(_ url: URL)` | ✅ |
| 5.2 | Go back | `goBack()` | ✅ |
| 5.3 | Go forward | `goForward()` | ✅ |
| 5.4 | Reload | `reload()` | ✅ |
| 5.5 | Stop loading | `stopLoading()` | ✅ |
| 5.6 | Capture snapshot | `captureSnapshot()` | ✅ |
| 5.7 | Find in page | `findInPage(_:backwards:)` | ✅ |
| 5.8 | Count find matches | `countFindMatches(_:completion:)` | ✅ |
| 5.9 | Clear find highlights | `clearFindHighlights()` | ✅ |
| 5.10 | Hide distracting items | `hideDistractingItems()` | ✅ |
| 5.11 | Translate page | `translatePage()` | ✅ |
| 5.12 | Search ChatGPT | `searchChatGPT()` | ✅ |
| 5.13 | Adjust text zoom | `adjustTextZoom(by:)` | ✅ |
| 5.14 | Toggle desktop site | `toggleDesktopSite()` | ✅ |
| 5.15 | Copy page diagnostics | `copyPageDiagnostics()` | ✅ |
| 5.16 | Print page | `printPage() -> Bool` | ✅ |
| 5.17 | Privacy summary | `var privacySummary: String` | ✅ |
| 5.18 | Crash detection + auto-reload | `webViewWebContentProcessDidTerminate(_:)` | ✅ |
| 5.19 | Manual retry after crash | `retryAfterCrash()` | ✅ |
| 5.20 | Scroll direction tracking | `scrollViewDidScroll(_:)` | ✅ |
| 5.21 | JS alert panel | `webView(_:runJavaScriptAlertPanelWithMessage:...)` | ✅ |
| 5.22 | JS confirm panel | `webView(_:runJavaScriptConfirmPanelWithMessage:...)` | ✅ |
| 5.23 | JS prompt panel | `webView(_:runJavaScriptTextInputPanelWithPrompt:...)` | ✅ |
| 5.24 | Create new webview for popup | `webView(_:createWebViewWith:for:windowFeatures:)` | ✅ |
| 5.25 | Decide navigation policy | `webView(_:decidePolicyFor:decisionHandler:)` | ✅ |
| 5.26 | Navigation delegate: start | `webView(_:didStartProvisionalNavigation:)` | ✅ |
| 5.27 | Navigation delegate: finish | `webView(_:didFinish:)` | ✅ |
| 5.28 | Navigation delegate: fail | `webView(_:didFail:withError:)` | ✅ |
| 5.29 | Navigation delegate: fail provisional | `webView(_:didFailProvisionalNavigation:withError:)` | ✅ |
| 5.30 | Callback: onOpenNewTab | `var onOpenNewTab: ((URL) -> Void)?` | ✅ |
| 5.31 | Callback: onOpenExternalURL | `var onOpenExternalURL: ((URL) -> Void)?` | ✅ |
| 5.32 | Callback: onUpdateHistory | `var onUpdateHistory: ((URL, String) -> Void)?` | ✅ |
| 5.33 | Callback: onScrollDirectionChange | `var onScrollDirectionChange: ((Bool) -> Void)?` | ✅ |

### Test Cases — `BrowserTabViewModelTests`

```
TC-5.1.1  load(https URL) → currentURL set, pageState = .loading
TC-5.1.2  load(blocked URL javascript:) → pageState = .failed(.securityBlocked)
TC-5.1.3  load(mailto: URL) → onOpenExternalURL callback called
TC-5.5.1  stopLoading() → pageState = .loaded
TC-5.7.1  findInPage("test") → evaluateJavaScript called with window.find("test")
TC-5.7.2  findInPage("test", backwards: true) → JS contains "true" for backwards
TC-5.8.1  countFindMatches("") → completion(0, 0) 
TC-5.13.1 adjustTextZoom(by: 10) → textZoomLevel == 110
TC-5.13.2 adjustTextZoom(by: -60) → textZoomLevel == 50 (clamped min)
TC-5.13.3 adjustTextZoom(by: 150) → textZoomLevel == 200 (clamped max)
TC-5.14.1 toggleDesktopSite() → isDesktopSite == true, customUserAgent != nil
TC-5.14.2 toggleDesktopSite() 2 lần → isDesktopSite == false, customUserAgent == nil
TC-5.15.1 copyPageDiagnostics() → UIPasteboard.general.string chứa title + URL
TC-5.17.1 privacySummary cho HTTPS private tab → chứa "HTTPS" + "phiên riêng tư"
TC-5.17.2 privacySummary cho HTTP normal tab → chứa "HTTP" + "phiên thường"
TC-5.18.1 Gọi webViewWebContentProcessDidTerminate 1 lần → auto-reload after 1s delay
TC-5.18.2 Gọi webViewWebContentProcessDidTerminate 3 lần < 60s → pageState = .failed(.webProcessCrashed)
TC-5.19.1 retryAfterCrash() → crashCount reset, pageState reset, reload called
TC-5.24.1 createWebViewWith popup → onOpenNewTab callback called
TC-5.26.1 didStartProvisionalNavigation → pageState == .loading(progress: 0.0)
TC-5.27.1 didFinish → pageState == .loaded, onUpdateHistory callback called
TC-5.28.1 didFail(NSURLErrorCancelled) → pageState NOT changed (ignored)
TC-5.28.2 didFail(real error) → pageState == .failed(.navigationFailed)
TC-5.30.1 Set onOpenNewTab, trigger createWebView → closure called with URL
```

---

## 6. Website Data Manager

**File**: `BrowserWebsiteDataManager.swift`

| # | Chức năng | Function | Có |
|---|---|---|---|
| 6.1 | Xóa toàn bộ website data | `clearAllWebsiteData(completion:)` | ✅ |
| 6.2 | Xóa chỉ cookies + cache | `clearCookiesAndCache(completion:)` | ✅ |

### Test Cases — `BrowserWebsiteDataManagerTests`

```
TC-6.1.1  clearAllWebsiteData → completion callback called
TC-6.2.1  clearCookiesAndCache → completion callback called
```

---

## 7. Favicon Cache

**File**: `BrowserModels.swift` — `FaviconCache`

| # | Chức năng | Function | Có |
|---|---|---|---|
| 7.1 | Get cached favicon | `getCachedFavicon(for: String) -> UIImage?` | ✅ |
| 7.2 | Load favicon (memory → disk → network) | `loadFavicon(for: String)` | ✅ |
| 7.3 | Failed domain tracking | `failedDomains: Set<String>` (private) | ✅ |
| 7.4 | Concurrent download prevention | `downloadingDomains: Set<String>` (private) | ✅ |

### Test Cases — `FaviconCacheTests`

```
TC-7.1.1  getCachedFavicon cho domain chưa load → nil
TC-7.2.1  loadFavicon("") → không download (empty guard)
TC-7.2.2  loadFavicon("example.com") 2 lần liên tiếp → chỉ trigger 1 download
TC-7.4.1  loadFavicon đang download → không trigger download thứ 2
```

---

## 8. Data Models

**File**: `BrowserModels.swift`

| # | Chức năng | Struct/Enum | Có |
|---|---|---|---|
| 8.1 | Page state tracking | `enum BrowserPageState` | ✅ |
| 8.2 | Error types | `enum BrowserError` | ✅ |
| 8.3 | Blocked reasons | `enum BrowserBlockedReason` | ✅ |
| 8.4 | Navigation decision | `enum BrowserNavigationDecision` | ✅ |
| 8.5 | History item | `struct BrowserHistoryItem` | ✅ |
| 8.6 | Bookmark | `struct BrowserBookmark` | ✅ |
| 8.7 | Reading list item | `struct BrowserReadingListItem` | ✅ |
| 8.8 | Browser route | `enum BrowserRoute` | ✅ |
| 8.9 | Frequent site | `struct FrequentSite` | ✅ |

### Test Cases — `BrowserModelsTests`

```
TC-8.1.1  BrowserPageState.idle == .idle → true
TC-8.1.2  BrowserPageState.loading(0.5) == .loading(0.5) → true
TC-8.1.3  BrowserPageState.loading(0.5) == .loading(0.7) → false
TC-8.1.4  BrowserPageState.idle == .loaded → false
TC-8.2.1  BrowserError.invalidURL.errorDescription != nil
TC-8.2.2  BrowserError.webProcessCrashed.errorDescription chứa "sập"
TC-8.5.1  BrowserHistoryItem Codable encode/decode round-trip
TC-8.6.1  BrowserBookmark Codable encode/decode round-trip
TC-8.7.1  BrowserReadingListItem Codable encode/decode round-trip
TC-8.9.1  FrequentSite.id == domain
```

---

## Tổng hợp Test Suite

| Test File | Class dưới test | # Tests | Link |
|---|---|---|---|
| `BrowserURLNormalizerTests.swift` | `BrowserURLNormalizer` | 16 | [BrowserURLNormalizerTests.swift](file:///Users/hoangnam/Developer/RustAlgorithmTrading/ios/iosAppTests/BrowserURLNormalizerTests.swift) |
| `BrowserNavigationPolicyTests.swift` | `BrowserNavigationPolicy` | 11 | [BrowserNavigationPolicyTests.swift](file:///Users/hoangnam/Developer/RustAlgorithmTrading/ios/iosAppTests/BrowserNavigationPolicyTests.swift) |
| `BrowserPersistenceStoreTests.swift` | `BrowserPersistenceStore` | 23 | [BrowserPersistenceStoreTests.swift](file:///Users/hoangnam/Developer/RustAlgorithmTrading/ios/iosAppTests/BrowserPersistenceStoreTests.swift) |
| `BrowserViewModelTests.swift` | `BrowserViewModel` | 22 | [BrowserViewModelTests.swift](file:///Users/hoangnam/Developer/RustAlgorithmTrading/ios/iosAppTests/BrowserViewModelTests.swift) |
| `BrowserTabViewModelTests.swift` | `BrowserTabViewModel` | 20 | [BrowserTabViewModelTests.swift](file:///Users/hoangnam/Developer/RustAlgorithmTrading/ios/iosAppTests/BrowserTabViewModelTests.swift) |
| `BrowserWebsiteDataManagerTests.swift` | `BrowserWebsiteDataManager` | 2 | [BrowserWebsiteDataManagerTests.swift](file:///Users/hoangnam/Developer/RustAlgorithmTrading/ios/iosAppTests/BrowserWebsiteDataManagerTests.swift) |
| `FaviconCacheTests.swift` | `FaviconCache` | 4 | [FaviconCacheTests.swift](file:///Users/hoangnam/Developer/RustAlgorithmTrading/ios/iosAppTests/FaviconCacheTests.swift) |
| `BrowserModelsTests.swift` | Models + Enums | 10 | [BrowserModelsTests.swift](file:///Users/hoangnam/Developer/RustAlgorithmTrading/ios/iosAppTests/BrowserModelsTests.swift) |
| **Tổng** | | **108** | |

---

## Ghi chú kỹ thuật & Cải tiến Test Suite

### 1. Phân loại chất lượng kiểm thử (Test Quality Classification)
*   **BrowserURLNormalizer (⭐️⭐️⭐️⭐️⭐️ - Xuất sắc)**: Pure logic, kiểm thử 100% tất cả các trường hợp biên của chuẩn hóa URL và bộ gõ tiếng Việt.
*   **BrowserNavigationPolicy (⭐️⭐️⭐️⭐️ - Rất tốt)**: Bao phủ đầy đủ các schemes an toàn, nguy hiểm và chuyển tiếp ra app ngoài.
*   **BrowserPersistenceStore (⭐️⭐️⭐️⭐️ - Tốt)**: Kiểm thử đầy đủ các logic nghiệp vụ (deduplication, limits, history query auto-extraction).
*   **BrowserViewModel (⭐️⭐️⭐️⭐️ - Tốt)**: Phủ được hầu hết luồng quản lý tab trong MainActor.
*   **BrowserTabViewModel (⭐️⭐️ - Trung bình/Yếu)**: Phụ thuộc vào `WKWebView`. Mặc dù đã giả lập được `WKNavigationDelegate` và test logic crash backoff, các phương thức inject JS (`findInPage`, `countFindMatches`, `hideDistractingItems`) chỉ mới chạy ở mức "không crash" chứ chưa kiểm thử được DOM thật bên trong.
*   **FaviconCache & WebsiteDataManager (⭐️⭐️ - Yếu)**: `FaviconCache` gọi trực tiếp network thật dễ gây flaky test; `WebsiteDataManager` gọi trực tiếp `WKWebsiteDataStore.default()` có thể ảnh hưởng đến cache thật của simulator.

### 2. Các điểm hạn chế & Rủi ro (Side Effects)
1.  **Tác động lên dữ liệu thật**: `BrowserPersistenceStoreTests` ghi trực tiếp dữ liệu test vào thư mục `Application Support/Browser` của máy chạy test.
2.  **Mất dữ liệu Clipboard**: Test case `copyPageDiagnostics()` ghi trực tiếp vào `UIPasteboard.general` thật của hệ thống.
3.  **Flaky do gọi API thật**: `FaviconCache` kết nối mạng trực tiếp để download favicon dễ bị lỗi khi offline hoặc mạng chậm.

### 3. Kế hoạch cải tiến (Next Steps)
-   **Dependency Injection (DI)**: Refactor `BrowserPersistenceStore` để nhận vào `storageDirectoryURL` thay vì hardcode thư mục mặc định, cho phép Unit Test truyền `NSTemporaryDirectory()` để đảm bảo môi trường độc lập.
-   **Mock Network**: Triển khai custom `URLProtocol` hoặc inject Mock Network Client vào `FaviconCache` để mock response favicon từ Google/Web.
-   **UI Integration Testing**: Chuyển các test case liên quan đến WKWebView JS interaction và giao diện (Find in page Match Index, Address bar collapse, More Menu animations) sang target **XCUITest (UI Test)** để kiểm thử hiển thị chính xác trên DOM thực tế.
-   **Kịch bản kiểm thử thủ công cho AI Agent (Simulator)**: Xem chi tiết hướng dẫn các bước thực tế tại [browser-manual-tests.md](file:///Users/hoangnam/Developer/RustAlgorithmTrading/ios/docs/browser-manual-tests.md).

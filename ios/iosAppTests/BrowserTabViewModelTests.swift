import WebKit
import XCTest
@testable import iosApp

@MainActor
final class BrowserTabViewModelTests: XCTestCase {
    private var tabViewModel: BrowserTabViewModel!

    override func setUp() {
        super.setUp()
        tabViewModel = BrowserTabViewModel(initialURL: nil, isPrivate: false)
    }

    override func tearDown() {
        tabViewModel = nil
        super.tearDown()
    }

    func testInitialState() {
        XCTAssertEqual(tabViewModel.title, "Tab Mới")
        XCTAssertNil(tabViewModel.currentURL)
        XCTAssertEqual(tabViewModel.pageState, .idle)
        XCTAssertFalse(tabViewModel.canGoBack)
        XCTAssertFalse(tabViewModel.canGoForward)
        XCTAssertNil(tabViewModel.snapshot)
        XCTAssertEqual(tabViewModel.textZoomLevel, 100)
        XCTAssertFalse(tabViewModel.isPrivate)
        XCTAssertFalse(tabViewModel.isDesktopSite)
    }

    func testLoadAllowedURLUpdatesCurrentURLAndLoadingState() throws {
        let url = try XCTUnwrap(URL(string: "https://example.com/path?q=1"))

        tabViewModel.load(url)

        XCTAssertEqual(tabViewModel.currentURL, url)
        XCTAssertEqual(tabViewModel.pageState, .loading(progress: 0))
    }

    func testCaptureSnapshotDoesNothingWhenWebViewIsNotOnScreen() {
        tabViewModel.captureSnapshot()

        XCTAssertNil(tabViewModel.snapshot)
    }

    func testAdjustTextZoomClampsBounds() {
        tabViewModel.adjustTextZoom(by: 20)
        XCTAssertEqual(tabViewModel.textZoomLevel, 120)

        tabViewModel.adjustTextZoom(by: 100)
        XCTAssertEqual(tabViewModel.textZoomLevel, 200)

        tabViewModel.adjustTextZoom(by: -300)
        XCTAssertEqual(tabViewModel.textZoomLevel, 50)
    }

    func testToggleDesktopSiteUpdatesUserAgent() {
        tabViewModel.toggleDesktopSite()
        XCTAssertTrue(tabViewModel.isDesktopSite)
        XCTAssertNotNil(tabViewModel.webView.customUserAgent)

        tabViewModel.toggleDesktopSite()
        XCTAssertFalse(tabViewModel.isDesktopSite)
        XCTAssertNil(tabViewModel.webView.customUserAgent)
    }

    func testPrivacySummaryReflectsNormalAndPrivateStores() throws {
        tabViewModel.currentURL = try XCTUnwrap(URL(string: "https://apple.com"))
        XCTAssertTrue(tabViewModel.privacySummary.contains("apple.com"))
        XCTAssertTrue(tabViewModel.privacySummary.contains("HTTPS"))
        XCTAssertTrue(tabViewModel.privacySummary.contains("phiên thường"))

        let privateTab = BrowserTabViewModel(
            initialURL: try XCTUnwrap(URL(string: "http://example.com")),
            isPrivate: true
        )
        XCTAssertTrue(privateTab.privacySummary.contains("example.com"))
        XCTAssertTrue(privateTab.privacySummary.contains("HTTP"))
        XCTAssertTrue(privateTab.privacySummary.contains("phiên riêng tư"))
    }

    func testNavigationDelegatesUpdatePageState() {
        tabViewModel.webView(tabViewModel.webView, didStartProvisionalNavigation: nil)
        XCTAssertEqual(tabViewModel.pageState, .loading(progress: 0))

        tabViewModel.webView(tabViewModel.webView, didFinish: nil)
        XCTAssertEqual(tabViewModel.pageState, .loaded)
    }

    func testNavigationDelegateIgnoresCancelledErrors() {
        let cancelled = NSError(domain: NSURLErrorDomain, code: NSURLErrorCancelled)

        tabViewModel.webView(tabViewModel.webView, didFail: nil, withError: cancelled)

        XCTAssertEqual(tabViewModel.pageState, .idle)
    }

    func testNavigationDelegateStoresNonCancelledError() {
        let error = NSError(
            domain: NSURLErrorDomain,
            code: NSURLErrorCannotFindHost,
            userInfo: [NSLocalizedDescriptionKey: "Host not found"]
        )

        tabViewModel.webView(tabViewModel.webView, didFail: nil, withError: error)

        XCTAssertEqual(tabViewModel.pageState, .failed(.navigationFailed("Host not found")))
    }

    func testCrashHandlingHaltsAfterThirdCrashForSameURL() throws {
        tabViewModel.currentURL = try XCTUnwrap(URL(string: "https://example.com"))

        tabViewModel.webViewWebContentProcessDidTerminate(tabViewModel.webView)
        XCTAssertEqual(tabViewModel.pageState, .loading(progress: 0))

        tabViewModel.webViewWebContentProcessDidTerminate(tabViewModel.webView)
        XCTAssertEqual(tabViewModel.pageState, .loading(progress: 0))

        tabViewModel.webViewWebContentProcessDidTerminate(tabViewModel.webView)
        XCTAssertEqual(tabViewModel.pageState, .failed(.webProcessCrashed))
    }

    func testRetryAfterCrashResetsState() throws {
        tabViewModel.currentURL = try XCTUnwrap(URL(string: "https://example.com"))
        tabViewModel.webViewWebContentProcessDidTerminate(tabViewModel.webView)
        tabViewModel.webViewWebContentProcessDidTerminate(tabViewModel.webView)
        tabViewModel.webViewWebContentProcessDidTerminate(tabViewModel.webView)
        XCTAssertEqual(tabViewModel.pageState, .failed(.webProcessCrashed))

        tabViewModel.retryAfterCrash()

        XCTAssertEqual(tabViewModel.pageState, .loading(progress: 0))
    }

    func testCopyPageDiagnostics() throws {
        let originalClipboard = UIPasteboard.general.string
        defer { UIPasteboard.general.string = originalClipboard }

        tabViewModel.title = "Test Page"
        tabViewModel.currentURL = try XCTUnwrap(URL(string: "https://example.com/diagnostics"))

        tabViewModel.copyPageDiagnostics()

        XCTAssertEqual(
            UIPasteboard.general.string,
            "Title: Test Page\nURL: https://example.com/diagnostics"
        )
    }
}

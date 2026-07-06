import XCTest
import WebKit
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
    
    // MARK: - Initial State
    
    func testInitialState() {
        XCTAssertEqual(tabViewModel.title, "Tab Mới")
        XCTAssertNil(tabViewModel.currentURL)
        XCTAssertEqual(tabViewModel.pageState, .idle)
        XCTAssertEqual(tabViewModel.textZoomLevel, 100)
        XCTAssertFalse(tabViewModel.isPrivate)
        XCTAssertFalse(tabViewModel.isDesktopSite)
    }
    
    // MARK: - Text Zoom
    
    func testAdjustTextZoom_clampsBounds() {
        tabViewModel.adjustTextZoom(by: 20)
        XCTAssertEqual(tabViewModel.textZoomLevel, 120)
        
        tabViewModel.adjustTextZoom(by: 100)
        XCTAssertEqual(tabViewModel.textZoomLevel, 200) // Clamps to max 200
        
        tabViewModel.adjustTextZoom(by: -200)
        XCTAssertEqual(tabViewModel.textZoomLevel, 50) // Clamps to min 50
    }
    
    // MARK: - Desktop Site Toggle
    
    func testToggleDesktopSite() {
        tabViewModel.toggleDesktopSite()
        XCTAssertTrue(tabViewModel.isDesktopSite)
        XCTAssertNotNil(tabViewModel.webView.customUserAgent)
        
        tabViewModel.toggleDesktopSite()
        XCTAssertFalse(tabViewModel.isDesktopSite)
        XCTAssertNil(tabViewModel.webView.customUserAgent)
    }
    
    // MARK: - Privacy Summary
    
    func testPrivacySummary() {
        tabViewModel.currentURL = URL(string: "https://apple.com")
        XCTAssertTrue(tabViewModel.privacySummary.contains("apple.com"))
        XCTAssertTrue(tabViewModel.privacySummary.contains("HTTPS"))
        XCTAssertTrue(tabViewModel.privacySummary.contains("phiên thường"))
        
        let privateTab = BrowserTabViewModel(initialURL: URL(string: "http://example.com"), isPrivate: true)
        XCTAssertTrue(privateTab.privacySummary.contains("example.com"))
        XCTAssertTrue(privateTab.privacySummary.contains("HTTP"))
        XCTAssertTrue(privateTab.privacySummary.contains("phiên riêng tư"))
    }
    
    // MARK: - WKNavigationDelegate Triggers
    
    func testNavigationDelegates_updatePageState() {
        tabViewModel.webView(tabViewModel.webView, didStartProvisionalNavigation: nil)
        XCTAssertEqual(tabViewModel.pageState, .loading(progress: 0.0))
        
        tabViewModel.webView(tabViewModel.webView, didFinish: nil)
        XCTAssertEqual(tabViewModel.pageState, .loaded)
    }
    
    func testNavigationDelegates_didFailWithError() {
        let testError = NSError(domain: NSURLErrorDomain, code: NSURLErrorCannotFindHost, userInfo: [NSLocalizedDescriptionKey: "Host not found"])
        tabViewModel.webView(tabViewModel.webView, didFail: nil, withError: testError)
        
        if case .failed(let browserError) = tabViewModel.pageState {
            XCTAssertTrue(browserError.localizedDescription.contains("Host not found"))
        } else {
            XCTFail("State should be failed")
        }
    }
    
    // MARK: - Crash Handling & Backoff
    
    func testCrashHandling_loopHaltedAfterMaxCrashes() {
        tabViewModel.currentURL = URL(string: "https://example.com")
        
        // 1st crash: auto-reload
        tabViewModel.webViewWebContentProcessDidTerminate(tabViewModel.webView)
        XCTAssertEqual(tabViewModel.pageState, .loading(progress: 0.0))
        
        // 2nd crash: auto-reload
        tabViewModel.webViewWebContentProcessDidTerminate(tabViewModel.webView)
        XCTAssertEqual(tabViewModel.pageState, .loading(progress: 0.0))
        
        // 3rd crash: halt browser
        tabViewModel.webViewWebContentProcessDidTerminate(tabViewModel.webView)
        XCTAssertEqual(tabViewModel.pageState, .failed(.webProcessCrashed))
    }
    
    func testRetryAfterCrash_resetsState() {
        tabViewModel.currentURL = URL(string: "https://example.com")
        
        // Crash 3 times to halt
        tabViewModel.webViewWebContentProcessDidTerminate(tabViewModel.webView)
        tabViewModel.webViewWebContentProcessDidTerminate(tabViewModel.webView)
        tabViewModel.webViewWebContentProcessDidTerminate(tabViewModel.webView)
        XCTAssertEqual(tabViewModel.pageState, .failed(.webProcessCrashed))
        
        // Retry
        tabViewModel.retryAfterCrash()
        XCTAssertEqual(tabViewModel.pageState, .loading(progress: 0.0))
    }
    
    func testCopyPageDiagnostics() {
        // Backup current clipboard content
        let originalClipboard = UIPasteboard.general.string
        
        tabViewModel.title = "Test Page"
        tabViewModel.currentURL = URL(string: "https://example.com/diagnostics")
        
        tabViewModel.copyPageDiagnostics()
        
        XCTAssertEqual(UIPasteboard.general.string, "Title: Test Page\nURL: https://example.com/diagnostics")
        
        // Restore original clipboard content
        UIPasteboard.general.string = originalClipboard
    }
}

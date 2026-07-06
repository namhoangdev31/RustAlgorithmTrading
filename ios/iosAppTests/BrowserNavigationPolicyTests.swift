import XCTest
@testable import iosApp

final class BrowserNavigationPolicyTests: XCTestCase {
    private var policy: BrowserNavigationPolicy!
    
    override func setUp() {
        super.setUp()
        policy = BrowserNavigationPolicy()
    }
    
    override func tearDown() {
        policy = nil
        super.tearDown()
    }
    
    // MARK: - Safe / Allowed Navigation
    
    func testDecidePolicy_allowedHttps() {
        guard let url = URL(string: "https://apple.com/page") else {
            XCTFail("Failed to parse URL")
            return
        }
        let decision = policy.decidePolicy(for: url, isMainFrame: true)
        XCTAssertEqual(decision, .allow)
    }
    
    func testDecidePolicy_allowedHttp() {
        guard let url = URL(string: "http://example.com") else {
            XCTFail("Failed to parse URL")
            return
        }
        let decision = policy.decidePolicy(for: url, isMainFrame: true)
        XCTAssertEqual(decision, .allow)
    }
    
    func testDecidePolicy_allowedAboutBlank() {
        guard let url = URL(string: "about:blank") else {
            XCTFail("Failed to parse URL")
            return
        }
        let decision = policy.decidePolicy(for: url, isMainFrame: true)
        XCTAssertEqual(decision, .allow)
    }
    
    // MARK: - Blocked Navigation (Dangerous Schemes)
    
    func testDecidePolicy_blockedFileScheme() {
        guard let url = URL(string: "file:///etc/hosts") else {
            XCTFail("Failed to parse URL")
            return
        }
        let decision = policy.decidePolicy(for: url, isMainFrame: true)
        XCTAssertEqual(decision, .blocked(reason: .unsafeScheme))
    }
    
    func testDecidePolicy_blockedJavascriptScheme() {
        guard let url = URL(string: "javascript:alert(1)") else {
            XCTFail("Failed to parse URL")
            return
        }
        let decision = policy.decidePolicy(for: url, isMainFrame: true)
        XCTAssertEqual(decision, .blocked(reason: .unsafeScheme))
    }
    
    func testDecidePolicy_blockedDataSchemeOnMainFrame() {
        guard let url = URL(string: "data:text/html,<h1>hello</h1>") else {
            XCTFail("Failed to parse URL")
            return
        }
        let decision = policy.decidePolicy(for: url, isMainFrame: true)
        XCTAssertEqual(decision, .blocked(reason: .unsafeScheme))
    }
    
    func testDecidePolicy_allowedDataSchemeOnSubFrame() {
        guard let url = URL(string: "data:image/png;base64,abc") else {
            XCTFail("Failed to parse URL")
            return
        }
        // Sub-frames loaded inside the page should be allowed (e.g. data URI images)
        let decision = policy.decidePolicy(for: url, isMainFrame: false)
        XCTAssertEqual(decision, .allow)
    }
    
    // MARK: - External Application Schemes
    
    func testDecidePolicy_openExternalMailto() {
        guard let url = URL(string: "mailto:support@example.com") else {
            XCTFail("Failed to parse URL")
            return
        }
        let decision = policy.decidePolicy(for: url, isMainFrame: true)
        XCTAssertEqual(decision, .openExternal(url))
    }
    
    func testDecidePolicy_openExternalTel() {
        guard let url = URL(string: "tel:+84123456789") else {
            XCTFail("Failed to parse URL")
            return
        }
        let decision = policy.decidePolicy(for: url, isMainFrame: true)
        XCTAssertEqual(decision, .openExternal(url))
    }
    
    func testDecidePolicy_openExternalAppStore() {
        guard let url = URL(string: "itms-apps://itunes.apple.com/app/id123") else {
            XCTFail("Failed to parse URL")
            return
        }
        let decision = policy.decidePolicy(for: url, isMainFrame: true)
        XCTAssertEqual(decision, .openExternal(url))
    }
    
    func testDecidePolicy_openExternalCustomScheme() {
        guard let url = URL(string: "myschema://open-feature") else {
            XCTFail("Failed to parse URL")
            return
        }
        let decision = policy.decidePolicy(for: url, isMainFrame: true)
        XCTAssertEqual(decision, .openExternal(url))
    }
}

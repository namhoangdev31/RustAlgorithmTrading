import XCTest
@testable import iosApp

final class BrowserTests: XCTestCase {
    
    // MARK: - BrowserURLNormalizer Tests
    
    func testURLNormalizer_withValidURL_returnsSameURL() {
        let normalizer = BrowserURLNormalizer()
        
        let url1 = normalizer.normalize("https://google.com")
        XCTAssertEqual(url1?.absoluteString, "https://google.com")
        
        let url2 = normalizer.normalize("http://example.com/path?query=1")
        XCTAssertEqual(url2?.absoluteString, "http://example.com/path?query=1")
    }
    
    func testURLNormalizer_withDomainOnly_prependsHTTPS() {
        let normalizer = BrowserURLNormalizer()
        
        let url = normalizer.normalize("apple.com")
        XCTAssertEqual(url?.absoluteString, "https://apple.com")
    }
    
    func testURLNormalizer_withSearchQuery_returnsGoogleSearchURL() {
        let normalizer = BrowserURLNormalizer()
        
        let url = normalizer.normalize("swiftui tutorials")
        XCTAssertEqual(url?.host, "www.google.com")
        XCTAssertEqual(url?.path, "/search")
        XCTAssertTrue(url?.query?.contains("q=swiftui%20tutorials") ?? false)
    }
    
    func testURLNormalizer_withDangerousSchemes_returnsNil() {
        let normalizer = BrowserURLNormalizer()
        
        XCTAssertNil(normalizer.normalize("javascript:alert(1)"))
        XCTAssertNil(normalizer.normalize("file:///etc/passwd"))
        XCTAssertNil(normalizer.normalize("data:text/html,<html></html>"))
    }
    
    func testURLNormalizer_redactURLForLogging() {
        let url = URL(string: "https://example.com/auth?token=secret123&code=456")!
        let redacted = BrowserURLNormalizer.redactURLForLogging(url)
        XCTAssertEqual(redacted, "https://example.com/auth?[redacted]")
    }
    
    // MARK: - BrowserNavigationPolicy Tests
    
    func testNavigationPolicy_decidePolicy() {
        let policy = BrowserNavigationPolicy()
        
        // Allowed
        XCTAssertEqual(policy.decidePolicy(for: URL(string: "https://google.com")!, isMainFrame: true), .allow)
        XCTAssertEqual(policy.decidePolicy(for: URL(string: "http://example.com")!, isMainFrame: true), .allow)
        XCTAssertEqual(policy.decidePolicy(for: URL(string: "about:blank")!, isMainFrame: true), .allow)
        
        // External
        let telURL = URL(string: "tel:123456789")!
        XCTAssertEqual(policy.decidePolicy(for: telURL, isMainFrame: true), .openExternal(telURL))
        
        let mailURL = URL(string: "mailto:test@example.com")!
        XCTAssertEqual(policy.decidePolicy(for: mailURL, isMainFrame: true), .openExternal(mailURL))
        
        // Blocked
        let fileURL = URL(string: "file:///test.txt")!
        XCTAssertEqual(policy.decidePolicy(for: fileURL, isMainFrame: true), .blocked(reason: .unsafeScheme))
        
        let jsURL = URL(string: "javascript:void(0)")!
        XCTAssertEqual(policy.decidePolicy(for: jsURL, isMainFrame: true), .blocked(reason: .unsafeScheme))
    }
}

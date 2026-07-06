import XCTest
@testable import iosApp

final class BrowserURLNormalizerTests: XCTestCase {
    private var normalizer: BrowserURLNormalizer!
    
    override func setUp() {
        super.setUp()
        normalizer = BrowserURLNormalizer()
    }
    
    override func tearDown() {
        normalizer = nil
        super.tearDown()
    }
    
    // MARK: - Rule 1: Block Dangerous Schemes
    
    func testNormalize_javascriptBlocked() {
        XCTAssertNil(normalizer.normalize("javascript:alert(1)"))
        XCTAssertNil(normalizer.normalize("JavaScript:void(0)"))
    }
    
    func testNormalize_fileBlocked() {
        XCTAssertNil(normalizer.normalize("file:///etc/passwd"))
        XCTAssertNil(normalizer.normalize("FILE://localhost/Users"))
    }
    
    func testNormalize_dataBlocked() {
        XCTAssertNil(normalizer.normalize("data:text/html,<h1>hi</h1>"))
        XCTAssertNil(normalizer.normalize("DATA:image/png;base64,123"))
    }
    
    // MARK: - Rule 2: Explicit Valid Scheme
    
    func testNormalize_explicitHttps() {
        let result = normalizer.normalize("https://example.com")
        XCTAssertEqual(result?.absoluteString, "https://example.com")
    }
    
    func testNormalize_explicitHttp() {
        let result = normalizer.normalize("http://example.com/path?q=1")
        XCTAssertEqual(result?.absoluteString, "http://example.com/path?q=1")
    }
    
    func testNormalize_explicitFtp() {
        let result = normalizer.normalize("ftp://server.local")
        XCTAssertEqual(result?.absoluteString, "ftp://server.local")
    }
    
    // MARK: - Rule 3: Web Address Without Scheme (IP, Localhost, Domain)
    
    func testNormalize_domainWithoutScheme() {
        let result = normalizer.normalize("example.com")
        XCTAssertEqual(result?.absoluteString, "https://example.com")
    }
    
    func testNormalize_domainWithPathAndQuery() {
        let result = normalizer.normalize("example.com/path/foo?bar=baz")
        XCTAssertEqual(result?.absoluteString, "https://example.com/path/foo?bar=baz")
    }
    
    func testNormalize_localhostWithoutScheme() {
        let result = normalizer.normalize("localhost:3000")
        XCTAssertEqual(result?.absoluteString, "http://localhost:3000")
    }
    
    func testNormalize_ipv4WithoutScheme() {
        let result = normalizer.normalize("127.0.0.1:8765/index.html")
        XCTAssertEqual(result?.absoluteString, "http://127.0.0.1:8765/index.html")
    }
    
    func testNormalize_ipv6WithoutScheme() {
        let result = normalizer.normalize("[::1]:8080")
        XCTAssertEqual(result?.absoluteString, "http://[::1]:8080")
    }
    
    // MARK: - Rule 4: Fallback to Search
    
    func testNormalize_searchWords() {
        let result = normalizer.normalize("hello world")
        XCTAssertEqual(result?.scheme, "https")
        XCTAssertEqual(result?.host, "www.google.com")
        XCTAssertEqual(result?.path, "/search")
        XCTAssertTrue(result?.query?.contains("q=hello%20world") == true)
    }
    
    func testNormalize_emptyOrWhitespace() {
        XCTAssertNil(normalizer.normalize(""))
        XCTAssertNil(normalizer.normalize("   "))
    }
    
    // MARK: - Percent-Encoding Fallbacks
    
    func testNormalize_unencodedCharsInQuery() {
        let result = normalizer.normalize("example.com/search?q=điện thoại")
        XCTAssertNotNil(result)
        XCTAssertEqual(result?.host, "example.com")
        // Check if query is correctly encoded
        XCTAssertTrue(result?.absoluteString.contains("%C4%91i%E1%BB%87n") == true)
    }
    
    // MARK: - Keyboard Normalization
    
    func testNormalize_keyboardPunctuation() {
        // Vietnamese keyboard ; instead of :
        let result = normalizer.normalize("127.0.0.1;8765/index.html")
        XCTAssertEqual(result?.absoluteString, "http://127.0.0.1:8765/index.html")
    }
    
    // MARK: - Redact URL for Logging
    
    func testRedactURLForLogging() {
        guard let url = URL(string: "https://example.com/path?token=secret123&user=john") else {
            XCTFail("Failed to build test URL")
            return
        }
        let redacted = BrowserURLNormalizer.redactURLForLogging(url)
        XCTAssertTrue(redacted.contains("token=<redacted>"))
        XCTAssertTrue(redacted.contains("user=<redacted>"))
    }
}

import XCTest
@testable import iosApp

final class BrowserModelsTests: XCTestCase {
    
    // MARK: - BrowserPageState Tests
    
    func testBrowserPageState_equality() {
        XCTAssertEqual(BrowserPageState.idle, .idle)
        XCTAssertEqual(BrowserPageState.loading(progress: 0.5), .loading(progress: 0.5))
        XCTAssertNotEqual(BrowserPageState.loading(progress: 0.5), .loading(progress: 0.7))
        XCTAssertNotEqual(BrowserPageState.loading(progress: 0.5), .idle)
        XCTAssertEqual(BrowserPageState.loaded, .loaded)
        
        let error1 = BrowserError.invalidURL
        let error2 = BrowserError.webProcessCrashed
        XCTAssertEqual(BrowserPageState.failed(error1), .failed(error1))
        XCTAssertNotEqual(BrowserPageState.failed(error1), .failed(error2))
    }
    
    // MARK: - BrowserError Tests
    
    func testBrowserError_descriptions() {
        XCTAssertEqual(BrowserError.invalidURL.errorDescription, "Địa chỉ URL không hợp lệ.")
        XCTAssertEqual(BrowserError.webProcessCrashed.errorDescription, "Trình duyệt bị sập bộ nhớ. Vui lòng tải lại trang.")
        
        let reason = "Insecure scheme"
        XCTAssertEqual(BrowserError.securityBlocked(reason: reason).errorDescription, "Trang web bị chặn vì lý do bảo mật: \(reason)")
    }
    
    // MARK: - Codable Round-Trips
    
    func testBrowserHistoryItem_codable() throws {
        let item = BrowserHistoryItem(url: "https://example.com", title: "Example")
        let data = try JSONEncoder().encode(item)
        let decoded = try JSONDecoder().decode(BrowserHistoryItem.self, from: data)
        
        XCTAssertEqual(item.url, decoded.url)
        XCTAssertEqual(item.title, decoded.title)
        XCTAssertEqual(item.id, decoded.id)
    }
    
    func testBrowserBookmark_codable() throws {
        let bookmark = BrowserBookmark(url: "https://apple.com", title: "Apple")
        let data = try JSONEncoder().encode(bookmark)
        let decoded = try JSONDecoder().decode(BrowserBookmark.self, from: data)
        
        XCTAssertEqual(bookmark.url, decoded.url)
        XCTAssertEqual(bookmark.title, decoded.title)
    }
    
    func testBrowserReadingListItem_codable() throws {
        let item = BrowserReadingListItem(url: "https://google.com", title: "Google", domain: "google.com")
        let data = try JSONEncoder().encode(item)
        let decoded = try JSONDecoder().decode(BrowserReadingListItem.self, from: data)
        
        XCTAssertEqual(item.url, decoded.url)
        XCTAssertEqual(item.title, decoded.title)
        XCTAssertEqual(item.domain, decoded.domain)
    }
}

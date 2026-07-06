import XCTest
@testable import iosApp

final class FaviconCacheTests: XCTestCase {
    private var cache: FaviconCache!
    private var tempDirectoryURL: URL!
    
    override func setUp() {
        super.setUp()
        let tempDir = NSTemporaryDirectory()
        let uniqueSubdir = UUID().uuidString
        tempDirectoryURL = URL(fileURLWithPath: tempDir).appendingPathComponent(uniqueSubdir, isDirectory: true)
        cache = FaviconCache(cacheDirectory: tempDirectoryURL)
    }
    
    override func tearDown() {
        cache = nil
        try? FileManager.default.removeItem(at: tempDirectoryURL)
        tempDirectoryURL = nil
        super.tearDown()
    }
    
    func testGetCachedFavicon_returnsNilForUncachedDomain() {
        let image = cache.getCachedFavicon(for: "nonexistent.domain.example")
        XCTAssertNil(image)
    }
    
    func testLoadFavicon_handlesEmptyDomain() {
        cache.loadFavicon(for: "")
        XCTAssertNil(cache.getCachedFavicon(for: ""))
    }
}

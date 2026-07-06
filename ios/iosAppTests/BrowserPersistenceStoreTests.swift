import XCTest
@testable import iosApp

final class BrowserPersistenceStoreTests: XCTestCase {
    private var store: BrowserPersistenceStore!
    private var tempDirectoryURL: URL!
    
    override func setUp() {
        super.setUp()
        let tempDir = NSTemporaryDirectory()
        let uniqueSubdir = UUID().uuidString
        tempDirectoryURL = URL(fileURLWithPath: tempDir).appendingPathComponent(uniqueSubdir, isDirectory: true)
        
        store = BrowserPersistenceStore(storageDirectory: tempDirectoryURL)
    }
    
    override func tearDown() {
        store = nil
        try? FileManager.default.removeItem(at: tempDirectoryURL)
        tempDirectoryURL = nil
        super.tearDown()
    }
    
    // MARK: - History Tests
    
    func testAddHistoryItem_success() {
        store.addHistoryItem(url: "https://example.com", title: "Example", isPrivate: false)
        
        XCTAssertEqual(store.history.count, 1)
        XCTAssertEqual(store.history.first?.url, "https://example.com")
        XCTAssertEqual(store.history.first?.title, "Example")
    }
    
    func testAddHistoryItem_privateMode_doesNotSave() {
        store.addHistoryItem(url: "https://example.com", title: "Example", isPrivate: true)
        
        XCTAssertTrue(store.history.isEmpty)
    }
    
    func testAddHistoryItem_deduplication() {
        store.addHistoryItem(url: "https://example.com", title: "Example 1", isPrivate: false)
        store.addHistoryItem(url: "https://example.com", title: "Example 2", isPrivate: false)
        
        XCTAssertEqual(store.history.count, 1)
        XCTAssertEqual(store.history.first?.title, "Example 2") // Timestamp updated
    }
    
    func testAddHistoryItem_deduplication_notConsecutive() {
        store.addHistoryItem(url: "https://example.com", title: "Example", isPrivate: false)
        store.addHistoryItem(url: "https://apple.com", title: "Apple", isPrivate: false)
        store.addHistoryItem(url: "https://example.com", title: "Example", isPrivate: false)
        
        XCTAssertEqual(store.history.count, 3)
    }
    
    func testAddHistoryItem_limitTo1000() {
        for i in 1...1005 {
            store.addHistoryItem(url: "https://example.com/\(i)", title: "Page \(i)", isPrivate: false)
        }
        XCTAssertEqual(store.history.count, 1000)
    }
    
    func testRemoveHistoryItem() {
        store.addHistoryItem(url: "https://example.com", title: "Example", isPrivate: false)
        store.addHistoryItem(url: "https://apple.com", title: "Apple", isPrivate: false)
        
        guard let itemToRemove = store.history.first(where: { $0.url == "https://example.com" }) else {
            XCTFail("Could not find item")
            return
        }
        
        store.removeHistoryItem(id: itemToRemove.id)
        XCTAssertEqual(store.history.count, 1)
        XCTAssertNil(store.history.first(where: { $0.url == "https://example.com" }))
    }
    
    // MARK: - Google Search Auto-extraction
    
    func testAddHistoryItem_extractsGoogleQueries() {
        store.addHistoryItem(url: "https://www.google.com/search?q=swift+unit+testing", title: "Google Search", isPrivate: false)
        
        XCTAssertTrue(store.searchQueries.contains("swift unit testing"))
    }
    
    // MARK: - Recently Viewed & Frequently Visited
    
    func testRecentlyViewed_uniqueByDomain() {
        store.addHistoryItem(url: "https://example.com/page1", title: "1", isPrivate: false)
        store.addHistoryItem(url: "https://example.com/page2", title: "2", isPrivate: false)
        store.addHistoryItem(url: "https://apple.com", title: "3", isPrivate: false)
        
        let recent = store.recentlyViewed
        XCTAssertEqual(recent.count, 2)
        XCTAssertTrue(recent.contains(where: { $0.url.contains("example.com") }))
        XCTAssertTrue(recent.contains(where: { $0.url.contains("apple.com") }))
    }
    
    func testFrequentlyVisited_sortsByCount() {
        // Domain 1: 3 visits
        store.addHistoryItem(url: "https://example.com/1", title: "E", isPrivate: false)
        store.addHistoryItem(url: "https://example.com/2", title: "E", isPrivate: false)
        store.addHistoryItem(url: "https://example.com/3", title: "E", isPrivate: false)
        
        // Domain 2: 1 visit
        store.addHistoryItem(url: "https://apple.com", title: "A", isPrivate: false)
        
        let frequent = store.frequentlyVisited
        XCTAssertEqual(frequent.count, 2)
        XCTAssertEqual(frequent.first?.domain, "example.com")
        XCTAssertEqual(frequent.first?.visitCount, 3)
    }
    
    // MARK: - Bookmarks Tests
    
    func testAddBookmark_success() {
        store.addBookmark(url: "https://example.com", title: "Example")
        
        XCTAssertEqual(store.bookmarks.count, 1)
        XCTAssertEqual(store.bookmarks.first?.url, "https://example.com")
    }
    
    func testAddBookmark_duplicatesBlocked() {
        store.addBookmark(url: "https://example.com", title: "Example")
        store.addBookmark(url: "https://example.com", title: "Example 2")
        
        XCTAssertEqual(store.bookmarks.count, 1)
    }
    
    func testRemoveBookmark() {
        store.addBookmark(url: "https://example.com", title: "Example")
        guard let bookmark = store.bookmarks.first else {
            XCTFail("No bookmark")
            return
        }
        
        store.removeBookmark(id: bookmark.id)
        XCTAssertTrue(store.bookmarks.isEmpty)
    }
    
    // MARK: - Reading List Tests
    
    func testAddReadingListItem_success() {
        store.addReadingListItem(url: "https://example.com", title: "Example")
        
        XCTAssertEqual(store.readingList.count, 1)
        XCTAssertEqual(store.readingList.first?.url, "https://example.com")
        XCTAssertEqual(store.readingList.first?.domain, "example.com")
    }
    
    func testAddReadingListItem_duplicatesBlocked() {
        store.addReadingListItem(url: "https://example.com", title: "Example")
        store.addReadingListItem(url: "https://example.com", title: "Example 2")
        
        XCTAssertEqual(store.readingList.count, 1)
    }
    
    func testRemoveReadingListItem() {
        store.addReadingListItem(url: "https://example.com", title: "Example")
        guard let item = store.readingList.first else {
            XCTFail("No item")
            return
        }
        store.removeReadingListItem(id: item.id)
        XCTAssertTrue(store.readingList.isEmpty)
    }
    
    // MARK: - Search Queries Tests
    
    func testAddSearchQuery_success() {
        store.addSearchQuery("swift")
        XCTAssertEqual(store.searchQueries.count, 1)
        XCTAssertEqual(store.searchQueries.first, "swift")
    }
    
    func testAddSearchQuery_dedup_bringToTop() {
        store.addSearchQuery("swift")
        store.addSearchQuery("ios")
        store.addSearchQuery("swift")
        
        XCTAssertEqual(store.searchQueries.count, 2)
        XCTAssertEqual(store.searchQueries.first, "swift")
    }
    
    func testAddSearchQuery_limitTo100() {
        for i in 1...105 {
            store.addSearchQuery("query \(i)")
        }
        XCTAssertEqual(store.searchQueries.count, 100)
    }
    
    // MARK: - Favorites Tests
    
    func testInitialFavorites_containsDefaults() {
        XCTAssertEqual(store.favorites.count, 4)
        XCTAssertEqual(store.favorites[0].title, "Apple")
        XCTAssertEqual(store.favorites[1].title, "Bing")
        XCTAssertEqual(store.favorites[2].title, "Google")
        XCTAssertEqual(store.favorites[3].title, "Yahoo!")
    }
    
    func testAddFavorite_success() {
        store.addFavorite(title: "GitLab", url: "https://gitlab.com")
        XCTAssertEqual(store.favorites.count, 5)
        XCTAssertEqual(store.favorites.last?.title, "GitLab")
        XCTAssertEqual(store.favorites.last?.url, "https://gitlab.com")
    }
    
    func testUpdateFavorite_success() {
        guard let first = store.favorites.first else {
            XCTFail("No favorites")
            return
        }
        
        store.updateFavorite(id: first.id, title: "Apple Inc.", url: "https://apple.com/vn")
        XCTAssertEqual(store.favorites.first?.title, "Apple Inc.")
        XCTAssertEqual(store.favorites.first?.url, "https://apple.com/vn")
    }
    
    func testDeleteFavorite_success() {
        guard let first = store.favorites.first else {
            XCTFail("No favorites")
            return
        }
        
        store.deleteFavorite(id: first.id)
        XCTAssertEqual(store.favorites.count, 3)
        XCTAssertNil(store.favorites.first(where: { $0.id == first.id }))
    }
}

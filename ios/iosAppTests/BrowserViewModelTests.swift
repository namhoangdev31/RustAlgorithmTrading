import XCTest
@testable import iosApp

@MainActor
final class BrowserViewModelTests: XCTestCase {
    private var store: BrowserPersistenceStore!
    private var viewModel: BrowserViewModel!
    private var tempDirectoryURL: URL!
    
    override func setUp() {
        super.setUp()
        let tempDir = NSTemporaryDirectory()
        let uniqueSubdir = UUID().uuidString
        tempDirectoryURL = URL(fileURLWithPath: tempDir).appendingPathComponent(uniqueSubdir, isDirectory: true)
        
        store = BrowserPersistenceStore(storageDirectory: tempDirectoryURL)
        viewModel = BrowserViewModel(persistenceStore: store)
    }
    
    override func tearDown() {
        viewModel.reset()
        viewModel = nil
        store = nil
        try? FileManager.default.removeItem(at: tempDirectoryURL)
        tempDirectoryURL = nil
        super.tearDown()
    }
    
    // MARK: - Initializer
    
    func testInitializer_createsOneDefaultTab() {
        XCTAssertEqual(viewModel.tabs.count, 1)
        XCTAssertFalse(viewModel.isPrivateMode)
        XCTAssertNil(viewModel.tabs.first?.currentURL)
    }
    
    func testInitializer_withURL() {
        let vm = BrowserViewModel(initialURL: "https://apple.com", isPrivate: false, persistenceStore: store)
        XCTAssertEqual(vm.tabs.count, 1)
        XCTAssertEqual(vm.tabs.first?.currentURL?.absoluteString, "https://apple.com")
    }
    
    // MARK: - Tab Creation
    
    func testCreateNewTab_normalMode() {
        viewModel.createNewTab(initialURL: URL(string: "https://example.com"), isPrivate: false)
        
        XCTAssertEqual(viewModel.tabs.count, 2)
        XCTAssertEqual(viewModel.activeTab?.currentURL?.absoluteString, "https://example.com")
        XCTAssertFalse(viewModel.activeTab?.isPrivate ?? true)
    }
    
    func testCreateNewTab_privateMode() {
        viewModel.createNewTab(initialURL: URL(string: "https://example.com"), isPrivate: true)
        
        XCTAssertEqual(viewModel.tabs.count, 2)
        XCTAssertEqual(viewModel.activeTab?.currentURL?.absoluteString, "https://example.com")
        XCTAssertTrue(viewModel.activeTab?.isPrivate ?? false)
        XCTAssertTrue(viewModel.isPrivateMode)
    }
    
    // MARK: - Tab Closing
    
    func testCloseTab_updatesActiveTab() {
        viewModel.createNewTab(initialURL: URL(string: "https://example.com"), isPrivate: false)
        let tab2Id = viewModel.activeTabId
        
        viewModel.closeTab(id: tab2Id)
        
        XCTAssertEqual(viewModel.tabs.count, 1)
        XCTAssertNotEqual(viewModel.activeTabId, tab2Id)
    }
    
    func testCloseTab_allTabsClosed_createsEmptyTab() {
        let firstTabId = viewModel.activeTabId
        viewModel.closeTab(id: firstTabId)
        
        XCTAssertEqual(viewModel.tabs.count, 1)
        XCTAssertNil(viewModel.activeTab?.currentURL)
    }
    
    func testCloseOtherTabs() {
        let tab1Id = viewModel.activeTabId
        viewModel.createNewTab(initialURL: URL(string: "https://example1.com"), isPrivate: false)
        let tab2Id = viewModel.activeTabId
        viewModel.createNewTab(initialURL: URL(string: "https://example2.com"), isPrivate: false)
        
        viewModel.closeOtherTabs(keepingId: tab2Id)
        
        XCTAssertEqual(viewModel.tabs.count, 1)
        XCTAssertEqual(viewModel.activeTabId, tab2Id)
    }
    
    func testCloseAllTabs() {
        viewModel.createNewTab(initialURL: URL(string: "https://example1.com"), isPrivate: false)
        viewModel.createNewTab(initialURL: URL(string: "https://example2.com"), isPrivate: true)
        
        viewModel.closeAllTabs(isPrivate: false)
        
        // Should close all normal tabs (and spawn an empty normal tab)
        XCTAssertEqual(viewModel.tabs.filter { !$0.isPrivate }.count, 1)
        XCTAssertNil(viewModel.tabs.first { !$0.isPrivate }?.currentURL)
        
        // Private tab remains untouched
        XCTAssertEqual(viewModel.tabs.filter { $0.isPrivate }.count, 1)
    }
    
    // MARK: - Tab Interactions
    
    func testDuplicateTab() {
        viewModel.createNewTab(initialURL: URL(string: "https://example.com"), isPrivate: false)
        guard let active = viewModel.activeTab else {
            XCTFail("No active tab")
            return
        }
        
        viewModel.duplicateTab(active)
        
        XCTAssertEqual(viewModel.tabs.count, 3)
        XCTAssertEqual(viewModel.activeTab?.currentURL?.absoluteString, "https://example.com")
    }
    
    func testSwitchTab() {
        let firstTabId = viewModel.activeTabId
        viewModel.createNewTab(initialURL: URL(string: "https://example.com"), isPrivate: false)
        let secondTabId = viewModel.activeTabId
        
        viewModel.switchTab(to: firstTabId)
        XCTAssertEqual(viewModel.activeTabId, firstTabId)
        
        viewModel.switchTab(to: secondTabId)
        XCTAssertEqual(viewModel.activeTabId, secondTabId)
    }
    
    // MARK: - URL Loading
    
    func testLoadURLString_loadsInActiveTab() {
        viewModel.loadURLString("https://example.com")
        XCTAssertEqual(viewModel.activeTab?.currentURL?.absoluteString, "https://example.com")
    }
    
    func testLoadURLString_forceNewTab() {
        viewModel.loadURLString("https://example.com", forceNewTab: true)
        XCTAssertEqual(viewModel.tabs.count, 2)
        XCTAssertEqual(viewModel.activeTab?.currentURL?.absoluteString, "https://example.com")
    }
    
    // MARK: - Add To Collections
    
    func testAddCurrentToBookmarks() {
        viewModel.loadURLString("https://example.com")
        viewModel.addCurrentToBookmarks()
        
        XCTAssertEqual(store.bookmarks.count, 1)
        XCTAssertEqual(store.bookmarks.first?.url, "https://example.com")
        XCTAssertEqual(viewModel.lastPageActionMessage, "Đã thêm vào Dấu trang.")
    }
    
    func testAddCurrentToReadingList() {
        viewModel.loadURLString("https://example.com")
        viewModel.addCurrentToReadingList()
        
        XCTAssertEqual(store.readingList.count, 1)
        XCTAssertEqual(store.readingList.first?.url, "https://example.com")
        XCTAssertEqual(viewModel.lastPageActionMessage, "Đã thêm vào Danh sách đọc.")
    }
}

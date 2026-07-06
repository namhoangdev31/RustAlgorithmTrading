import XCTest
import WebKit
@testable import iosApp

final class BrowserWebsiteDataManagerTests: XCTestCase {
    private var manager: BrowserWebsiteDataManager!
    
    override func setUp() {
        super.setUp()
        manager = BrowserWebsiteDataManager()
    }
    
    override func tearDown() {
        manager = nil
        super.tearDown()
    }
    
    func testClearAllWebsiteData_callsCompletion() {
        let expectation = self.expectation(description: "Clear data completion called")
        
        manager.clearAllWebsiteData {
            expectation.fulfill()
        }
        
        waitForExpectations(timeout: 5.0, handler: nil)
    }
    
    func testClearCookiesAndCache_callsCompletion() {
        let expectation = self.expectation(description: "Clear cookies completion called")
        
        manager.clearCookiesAndCache {
            expectation.fulfill()
        }
        
        waitForExpectations(timeout: 5.0, handler: nil)
    }
}

import Foundation
import WebKit

public struct BrowserWebsiteDataManager {
    public init() {}
    
    public func clearAllWebsiteData(completion: @escaping () -> Void) {
        let dataTypes = WKWebsiteDataStore.allWebsiteDataTypes()
        let dateFrom = Date(timeIntervalSince1970: 0)
        
        WKWebsiteDataStore.default().removeData(ofTypes: dataTypes, modifiedSince: dateFrom) {
            DispatchQueue.main.async {
                completion()
            }
        }
    }
    
    public func clearCookiesAndCache(completion: @escaping () -> Void) {
        let dataTypes = [WKWebsiteDataTypeCookies, WKWebsiteDataTypeDiskCache, WKWebsiteDataTypeMemoryCache]
        let dateFrom = Date(timeIntervalSince1970: 0)
        
        WKWebsiteDataStore.default().removeData(ofTypes: Set(dataTypes), modifiedSince: dateFrom) {
            DispatchQueue.main.async {
                completion()
            }
        }
    }
}

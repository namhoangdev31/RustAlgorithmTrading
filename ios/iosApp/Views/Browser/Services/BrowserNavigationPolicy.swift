import Foundation

public struct BrowserNavigationPolicy {
    public init() {}
    
    public func decidePolicy(for url: URL, isMainFrame: Bool) -> BrowserNavigationDecision {
        guard let scheme = url.scheme?.lowercased() else {
            return .blocked(reason: .unsafeScheme)
        }
        
        // 1. Block dangerous schemes
        if scheme == "file" || scheme == "javascript" || (scheme == "data" && isMainFrame) {
            return .blocked(reason: .unsafeScheme)
        }
        
        // 2. Allow http and https navigation
        if scheme == "http" || scheme == "https" || url.absoluteString == "about:blank" {
            return .allow
        }
        
        // 3. Handle known external apps schemes
        let externalSchemes = ["mailto", "tel", "sms", "maps", "itms-apps", "appstore"]
        if externalSchemes.contains(scheme) {
            return .openExternal(url)
        }
        
        // 4. Default: Open external for unknown custom schemes
        return .openExternal(url)
    }
}

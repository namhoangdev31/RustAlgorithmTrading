import Foundation

public struct BrowserURLNormalizer {
    public init() {}
    
    public func normalize(_ input: String) -> URL? {
        let trimmed = input.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty { return nil }
        
        // Block dangerous/unsupported schemes early
        let lowercased = trimmed.lowercased()
        if lowercased.hasPrefix("javascript:") || lowercased.hasPrefix("file:") || lowercased.hasPrefix("data:") {
            return nil
        }
        
        // Check if it's already a valid HTTP/HTTPS URL
        if (lowercased.hasPrefix("http://") || lowercased.hasPrefix("https://")), let url = URL(string: trimmed) {
            return url
        }
        
        // If it looks like a domain name, prepend https://
        if isValidDomain(trimmed) {
            if let url = URL(string: "https://\(trimmed)") {
                return url
            }
        }
        
        // Otherwise, treat as search query
        let queryHost = "https://www.google.com/search"
        if var components = URLComponents(string: queryHost) {
            components.queryItems = [URLQueryItem(name: "q", value: trimmed)]
            return components.url
        }
        
        return nil
    }
    
    private func isValidDomain(_ input: String) -> Bool {
        // Basic domain regex validation
        let domainRegex = "^([a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,}$"
        let predicate = NSPredicate(format: "SELF MATCHES %@", domainRegex)
        return predicate.evaluate(with: input)
    }
    
    /// Redacts query parameters for URL logging
    public static func redactURLForLogging(_ url: URL) -> String {
        guard var components = URLComponents(url: url, resolvingAgainstBaseURL: false) else {
            return url.absoluteString
        }
        if components.queryItems != nil {
            components.query = "[redacted]"
        }
        return components.string ?? url.absoluteString
    }
}

import Foundation

public struct BrowserURLNormalizer {
    public init() {}
    
    /// Normalize user input into a navigable URL.
    ///
    /// Decision rules (evaluated in order):
    /// 1. Block dangerous schemes (`javascript:`, `file:`, `data:`)
    /// 2. Input has explicit valid scheme (`http://`, `https://`, `ftp://`, …) → parse as URL
    /// 3. No spaces AND authority looks like IP/domain/localhost → prepend scheme, build URL
    /// 4. Everything else → Google search
    public func normalize(_ input: String) -> URL? {
        let trimmed = normalizeKeyboardPunctuation(input.trimmingCharacters(in: .whitespacesAndNewlines))
        if trimmed.isEmpty { return nil }
        
        // Rule 1: Block dangerous/unsupported schemes
        let lowercased = trimmed.lowercased()
        if lowercased.hasPrefix("javascript:") || lowercased.hasPrefix("file:") || lowercased.hasPrefix("data:") {
            return nil
        }
        
        // Rule 2: Explicit scheme present (letter-based scheme followed by "://")
        if let schemeURL = parseWithExplicitScheme(trimmed) {
            return schemeURL
        }
        
        // Rule 3: No spaces → try as web address (IP/domain/localhost + optional port/path/query)
        if !trimmed.contains(" "), let webURL = buildWebURL(from: trimmed) {
            return webURL
        }
        
        // Rule 4: Treat as Google search
        return buildSearchURL(query: trimmed)
    }
    
    // MARK: - Rule 2: Explicit Scheme
    
    private func parseWithExplicitScheme(_ input: String) -> URL? {
        // Must have "scheme://" pattern where scheme starts with a letter
        guard let colonIndex = input.firstIndex(of: ":"),
              colonIndex > input.startIndex,
              let first = input.first, first.isLetter else {
            return nil
        }
        let scheme = String(input[..<colonIndex]).lowercased()
        let validSchemeChars = CharacterSet.alphanumerics.union(CharacterSet(charactersIn: "+-."))
        guard scheme.unicodeScalars.allSatisfy({ validSchemeChars.contains($0) }) else {
            return nil
        }
        // Try direct parse first
        if let url = URL(string: input) {
            return url
        }
        // Fallback: percent-encode path/query via URLComponents
        return percentEncodeAndParse(input)
    }
    
    // MARK: - Rule 3: Web Address Without Scheme
    
    private func buildWebURL(from input: String) -> URL? {
        let delimiters = CharacterSet(charactersIn: "/?#")
        let firstDelimiter = input.rangeOfCharacter(from: delimiters)?.lowerBound ?? input.endIndex
        let authority = String(input[..<firstDelimiter])
        let pathAndRest = String(input[firstDelimiter...])
        
        guard let host = hostFromAuthority(authority), isValidHost(host) else { return nil }
        
        let scheme = isLocalHost(host) ? "http" : "https"
        let fullString = "\(scheme)://\(authority)\(pathAndRest)"
        
        // Try direct parse
        if let url = URL(string: fullString) {
            return url
        }
        // Fallback: use URLComponents to handle percent-encoding
        return percentEncodeAndParse(fullString)
    }
    
    // MARK: - Rule 4: Search
    
    private func buildSearchURL(query: String) -> URL? {
        let queryHost = "https://www.google.com/search"
        guard var components = URLComponents(string: queryHost) else { return nil }
        components.queryItems = [URLQueryItem(name: "q", value: query)]
        return components.url
    }
    
    // MARK: - Percent-Encoding Fallback
    
    /// When `URL(string:)` rejects a string (e.g. unencoded query chars), use URLComponents
    /// to parse and let Foundation handle percent-encoding automatically.
    private func percentEncodeAndParse(_ rawURL: String) -> URL? {
        // URLComponents is more lenient than URL(string:) and auto-encodes
        guard let components = URLComponents(string: rawURL) else {
            // Last resort: manually encode the path/query portion
            return manualPercentEncode(rawURL)
        }
        return components.url
    }
    
    private func manualPercentEncode(_ rawURL: String) -> URL? {
        // Split at "://" to preserve the scheme
        guard let schemeEnd = rawURL.range(of: "://") else { return nil }
        let scheme = String(rawURL[..<schemeEnd.lowerBound])
        let rest = String(rawURL[schemeEnd.upperBound...])
        
        // Encode the rest using URL-safe characters
        let allowed = CharacterSet.urlHostAllowed
            .union(.urlPathAllowed)
            .union(.urlQueryAllowed)
            .union(.urlFragmentAllowed)
        guard let encoded = rest.addingPercentEncoding(withAllowedCharacters: allowed) else { return nil }
        return URL(string: "\(scheme)://\(encoded)")
    }
    
    // MARK: - Keyboard Punctuation Normalization
    
    /// Vietnamese/international keyboards sometimes produce `;` instead of `:` for port separators.
    /// Normalize a single `;` in the authority portion (before any `/`, `?`, `#`) to `:`.
    private func normalizeKeyboardPunctuation(_ input: String) -> String {
        guard !input.contains(" "), input.contains(";") else { return input }
        let delimiters = CharacterSet(charactersIn: "/?#")
        let firstDelimiter = input.rangeOfCharacter(from: delimiters)?.lowerBound ?? input.endIndex
        let authority = String(input[..<firstDelimiter])
        guard authority.contains(";"),
              authority.filter({ $0 == ";" }).count == 1 else { return input }
        let normalizedAuthority = authority.replacingOccurrences(of: ";", with: ":")
        return normalizedAuthority + String(input[firstDelimiter...])
    }

    // MARK: - Authority Parsing

    private func hostFromAuthority(_ authority: String) -> String? {
        guard !authority.isEmpty else { return nil }
        // IPv6: [::1] style
        if authority.hasPrefix("[") {
            guard let closing = authority.firstIndex(of: "]") else { return nil }
            return String(authority[authority.startIndex...closing])
        }
        // host:port or just host
        let pieces = authority.split(separator: ":", maxSplits: 1, omittingEmptySubsequences: false)
        guard let host = pieces.first, !host.isEmpty else { return nil }
        if pieces.count == 2, !(pieces[1].allSatisfy(\.isNumber) && !pieces[1].isEmpty) {
            return nil // invalid port
        }
        return String(host)
    }

    // MARK: - Host Validation

    private func isValidHost(_ input: String) -> Bool {
        isLocalHost(input) || isIPv4Address(input) || isValidDomain(input)
    }

    private func isLocalHost(_ input: String) -> Bool {
        let lower = input.lowercased()
        return lower == "localhost" || input.hasPrefix("127.") || input == "0.0.0.0" || input == "::1"
    }

    private func isIPv4Address(_ input: String) -> Bool {
        let octets = input.split(separator: ".")
        guard octets.count == 4 else { return false }
        return octets.allSatisfy { octet in
            guard let value = Int(octet), value >= 0, value <= 255 else { return false }
            return String(value) == octet || octet == "0"
        }
    }

    /// Domain: one or more labels separated by dots, ending with a 2+ letter TLD.
    /// Port is NOT included here — it's already stripped by hostFromAuthority.
    private func isValidDomain(_ input: String) -> Bool {
        let labels = input.split(separator: ".", omittingEmptySubsequences: false)
        guard labels.count >= 2 else { return false }
        guard let tld = labels.last, tld.count >= 2, tld.allSatisfy({ $0.isLetter }) else { return false }
        return labels.allSatisfy { label in
            !label.isEmpty && label.allSatisfy { $0.isLetter || $0.isNumber || $0 == "-" }
        }
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

import Foundation

/// Utility to detect and block ad tracking and popup/redirect networks.
public struct BrowserAdBlocker {
    /// Comprehensive list of keywords commonly found in ad/popup networks and trackers.
    private static let adKeywords: Set<String> = [
        "doubleclick", "googleadservices", "googlesyndication", "adservice",
        "adsystem", "popads", "popcash", "mgid", "exoclick", "propellerads",
        "onclickads", "adsterra", "revenuehits", "bidvertiser", "clickadu",
        "popunder", "adcolony", "applovin", "unityads", "ironsource",
        "admob", "mobicow", "juicyads", "rtb", "dsp", "ssp", "nativeads",
        "adtrack", "affiliate", "tracking", "leads", "directrev", "redirect",
        "onclick", "onclickpredictive", "popmyads", "adbuff", "adreact",
        "ero-advertising", "adcash", "yllix", "ad-maven", "adnxs",
        "adform", "taboola", "outbrain", "criteo", "amazon-adsystem"
    ]

    /// Well-known trusted domains that are allowed to open in new tabs/windows.
    private static let trustedDomains: Set<String> = [
        "google.com", "google.com.vn", "gmail.com", "youtube.com", "facebook.com",
        "instagram.com", "twitter.com", "x.com", "linkedin.com", "github.com",
        "wikipedia.org", "apple.com", "microsoft.com", "bing.com", "yahoo.com"
    ]

    /// Checks if a URL matches known ad domains or keywords.
    public static func shouldBlock(url: URL) -> Bool {
        let host = url.host?.lowercased() ?? ""
        let path = url.path.lowercased()
        let query = url.query?.lowercased() ?? ""

        // Check host domain components
        let hostComponents = host.components(separatedBy: ".")
        for component in hostComponents {
            if adKeywords.contains(component) {
                return true
            }
        }

        // Check path and query parameters for ad keywords
        for keyword in adKeywords {
            if path.contains(keyword) || query.contains(keyword) {
                return true
            }
        }

        return false
    }

    /// Checks if host is a trusted global service.
    public static func isTrustedDomain(host: String) -> Bool {
        let lowerHost = host.lowercased()
        for trusted in trustedDomains {
            if lowerHost == trusted || lowerHost.hasSuffix("." + trusted) {
                return true
            }
        }
        return false
    }

    /// Proactively decides if a cross-origin new window request should be blocked.
    /// Blocks new window requests that point to different domains than the source domain,
    /// unless the target domain is explicitly trusted (e.g. google, facebook).
    public static func shouldBlockProactively(requestURL: URL, sourceURL: URL?) -> Bool {
        // 1. If matches known ad list, block immediately
        if shouldBlock(url: requestURL) {
            return true
        }

        guard let requestHost = requestURL.host?.lowercased() else { return false }
        guard let sourceHost = sourceURL?.host?.lowercased(), !sourceHost.isEmpty else { return false }

        // 2. If hosts are matching or subdomains, allow (e.g., movies.com -> play.movies.com)
        if requestHost == sourceHost || requestHost.hasSuffix("." + sourceHost) || sourceHost.hasSuffix("." + requestHost) {
            return false
        }

        // 3. If target is a trusted domain (Google search, social share), allow
        if isTrustedDomain(host: requestHost) {
            return false
        }

        // 4. Otherwise, block proactively (untrusted cross-origin popup)
        return true
    }
}

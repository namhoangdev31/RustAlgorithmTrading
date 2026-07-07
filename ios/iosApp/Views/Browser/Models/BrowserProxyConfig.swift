import Foundation
import Network

/// Proxy configuration for Browser private tabs.
/// Applied via `WKWebsiteDataStore.proxyConfigurations` (iOS 17+).
public struct BrowserProxyConfig: Codable, Equatable {
    public var host: String        // e.g. "proxy.example.com"
    public var port: UInt16        // e.g. 8080
    public var type: ProxyType     // .http or .socks5

    public enum ProxyType: String, Codable, CaseIterable, Identifiable {
        case http = "HTTP"
        case socks5 = "SOCKS5"

        public var id: String { rawValue }
    }

    public var displayString: String {
        "\(type.rawValue) \(host):\(port)"
    }

    /// Build a `Network.ProxyConfiguration` for `WKWebsiteDataStore`.
    @available(iOS 17.0, *)
    public func toProxyConfiguration() -> ProxyConfiguration {
        let endpoint = NWEndpoint.hostPort(
            host: NWEndpoint.Host(host),
            port: NWEndpoint.Port(rawValue: port)!
        )
        switch type {
        case .http:
            return ProxyConfiguration(httpCONNECTProxy: endpoint)
        case .socks5:
            return ProxyConfiguration(socksv5Proxy: endpoint)
        }
    }
}

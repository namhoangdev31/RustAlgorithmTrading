import Foundation

enum AppConfig {
    static let apiBaseUrl = "http://192.168.1.53:8081/api/v1/"
    static let quantAntBaseURL = configuredURL(
        key: "QUANTANT_CONTROL_PLANE_URL",
        fallback: "http://192.168.1.53:8081"
    )
    static let quantAntWebSocketURL = configuredURL(
        key: "QUANTANT_WEBSOCKET_URL",
        fallback: "ws://192.168.1.53:8081/ws/v1/quantant"
    )
    static let environment = "development"

    enum UI {
        static let cornerRadius: CGFloat = 12
        static let padding: CGFloat = 16
    }

    private static func configuredURL(key: String, fallback: String) -> URL {
        let configured = Bundle.main.object(forInfoDictionaryKey: key) as? String
        let value = configured.flatMap { $0.isEmpty ? nil : $0 } ?? fallback
        guard let url = URL(string: value) else {
            preconditionFailure("Invalid URL for \(key)")
        }
        return url
    }
}

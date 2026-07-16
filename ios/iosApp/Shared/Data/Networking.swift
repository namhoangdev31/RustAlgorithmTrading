import Foundation
import Security

// MARK: - API Service (replaces KMP ApiService + BundleApiService)

class ApiService {
    private let baseUrl: String
    private let session: URLSession
    private let decoder: JSONDecoder
    
    init(baseUrl: String) {
        self.baseUrl = baseUrl.hasSuffix("/") ? baseUrl : "\(baseUrl)/"
        
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 60
        self.session = URLSession(configuration: config)
        
        self.decoder = JSONDecoder()
        self.decoder.dateDecodingStrategy = .iso8601
    }
    
    func request<T: Decodable>(_ endpoint: String, method: String = "GET", body: Data? = nil) async throws -> T {
        guard let url = URL(string: "\(baseUrl)\(endpoint)") else {
            throw AppError.networkError(message: "Invalid URL: \(endpoint)")
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = body
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw AppError.networkError(message: "Invalid response")
        }
        
        guard (200...299).contains(httpResponse.statusCode) else {
            throw AppError.serverError(
                code: httpResponse.statusCode,
                message: errorMessage(from: data, response: httpResponse)
            )
        }
        
        return try decoder.decode(T.self, from: data)
    }

    private func errorMessage(from data: Data, response: HTTPURLResponse) -> String {
        if let apiError = try? decoder.decode(APIErrorEnvelope.self, from: data),
           let message = apiError.error?.trimmingCharacters(in: .whitespacesAndNewlines),
           !message.isEmpty {
            return message
        }

        if response.statusCode == 502 || response.statusCode == 503 || response.statusCode == 504 {
            return "Service temporarily unavailable. Please try again in a moment."
        }

        guard let raw = String(data: data, encoding: .utf8)?
            .trimmingCharacters(in: .whitespacesAndNewlines),
              !raw.isEmpty else {
            return HTTPURLResponse.localizedString(forStatusCode: response.statusCode).capitalized
        }

        if raw.contains("<html") || raw.contains("<body") || raw.contains("<!DOCTYPE") {
            return "Server returned an unexpected response. Please try again later."
        }

        return raw
    }
}

private struct APIErrorEnvelope: Decodable {
    let error: String?
}

// MARK: - Token Storage (replaces KMP TokenStorage)

final class TokenStorage: @unchecked Sendable {
    private let service = Bundle.main.bundleIdentifier ?? "com.lepos.quantant"

    func save(key: String, value: String) {
        let data = Data(value.utf8)
        let query = baseQuery(key: key)
        SecItemDelete(query as CFDictionary)
        var insert = query
        insert[kSecValueData as String] = data
        insert[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        SecItemAdd(insert as CFDictionary, nil)
    }

    func get(key: String) -> String? {
        var query = baseQuery(key: key)
        query[kSecReturnData as String] = true
        query[kSecMatchLimit as String] = kSecMatchLimitOne
        var result: CFTypeRef?
        guard SecItemCopyMatching(query as CFDictionary, &result) == errSecSuccess,
              let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    func remove(key: String) {
        SecItemDelete(baseQuery(key: key) as CFDictionary)
    }

    func clear() {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service
        ]
        SecItemDelete(query as CFDictionary)
    }

    private func baseQuery(key: String) -> [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecAttrSynchronizable as String: kCFBooleanFalse as Any
        ]
    }
}

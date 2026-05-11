import Foundation

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
            throw AppError.serverError(code: httpResponse.statusCode, message: String(data: data, encoding: .utf8))
        }
        
        return try decoder.decode(T.self, from: data)
    }
}

// MARK: - Token Storage (replaces KMP TokenStorage)

class TokenStorage {
    private var storage: [String: String] = [:]
    
    func save(key: String, value: String) {
        storage[key] = value
    }
    
    func get(key: String) -> String? {
        return storage[key]
    }
    
    func remove(key: String) {
        storage.removeValue(forKey: key)
    }
    
    func clear() {
        storage.removeAll()
    }
}

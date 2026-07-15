import Foundation

enum QuantAntClientError: Error, Sendable {
    case unauthorized
    case offline
    case invalidResponse
    case server(QuantAntAPIErrorDTO)
}

actor QuantAntAPIClient {
    private let baseURL: URL
    private let tokenStorage: TokenStorage
    private let session: URLSession
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder

    init(baseURL: URL, tokenStorage: TokenStorage, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.tokenStorage = tokenStorage
        self.session = session
        decoder = Self.makeDecoder()
        encoder = JSONEncoder()
        encoder.keyEncodingStrategy = .convertToSnakeCase
        encoder.dateEncodingStrategy = .iso8601
    }

    func bootstrap() async throws -> QuantAntSnapshot<QuantAntBootstrapDTO> {
        try await get("bootstrap")
    }

    func instruments(query: String = "", cursor: String? = nil) async throws -> QuantAntSnapshot<[QuantAntInstrumentDTO]> {
        try await get("instruments", query: ["q": query, "cursor": cursor])
    }

    func instrument(id: String) async throws -> QuantAntSnapshot<QuantAntInstrumentDTO> {
        try await get("instruments/\(id)")
    }

    func candles(instrumentID: String, interval: String = "1m") async throws -> QuantAntSnapshot<[QuantAntCandleDTO]> {
        try await get("candles", query: ["instrument_id": instrumentID, "interval": interval, "limit": "500"])
    }

    func portfolio(accountID: String, mode: QuantAntTradingMode) async throws -> QuantAntSnapshot<QuantAntPortfolioDTO> {
        try await get("portfolio", query: ["account_id": accountID, "mode": mode.rawValue])
    }

    func positions(accountID: String) async throws -> QuantAntSnapshot<[QuantAntPositionDTO]> {
        try await get("positions", query: ["account_id": accountID])
    }

    func orders(accountID: String) async throws -> QuantAntSnapshot<[QuantAntOrderDTO]> {
        try await get("orders", query: ["account_id": accountID])
    }

    func records(path: String, accountID: String) async throws -> QuantAntSnapshot<[QuantAntRecordDTO]> {
        try await get(path, query: ["account_id": accountID])
    }

    func strategyTemplates() async throws -> QuantAntSnapshot<[QuantAntStrategyTemplateDTO]> {
        try await get("strategy-templates")
    }

    func submitOrder(_ request: QuantAntCreateOrderRequest, liveSession: String? = nil) async throws -> QuantAntOrderDTO {
        var headers = ["Idempotency-Key": UUID().uuidString.lowercased()]
        headers["X-QuantAnt-Live-Session"] = liveSession
        return try await send("orders", method: "POST", body: try encoder.encode(request), headers: headers)
    }

    func cancelOrder(id: String, accountID: String) async throws {
        let _: QuantAntEmptyResponse = try await send(
            "orders/\(id)/cancel", method: "POST", query: ["account_id": accountID],
            headers: ["Idempotency-Key": UUID().uuidString.lowercased()]
        )
    }

    func closePosition(symbol: String, accountID: String, quantity: String?) async throws {
        let body = try encoder.encode(ClosePositionBody(accountID: accountID, quantity: quantity))
        let _: QuantAntEmptyResponse = try await send(
            "positions/\(symbol)/close", method: "POST", body: body,
            headers: ["Idempotency-Key": UUID().uuidString.lowercased()]
        )
    }

    private func get<T: Decodable & Sendable>(_ path: String, query: [String: String?] = [:]) async throws -> T {
        try await send(path, query: query)
    }

    private func send<T: Decodable & Sendable>(
        _ path: String,
        method: String = "GET",
        query: [String: String?] = [:],
        body: Data? = nil,
        headers: [String: String?] = [:]
    ) async throws -> T {
        guard let token = tokenStorage.get(key: "access_token"), !token.isEmpty else {
            throw QuantAntClientError.unauthorized
        }
        var components = URLComponents(url: baseURL.appending(path: "api/v1/quantant/\(path)"), resolvingAgainstBaseURL: false)!
        components.queryItems = query.compactMap { key, value in value.map { URLQueryItem(name: key, value: $0) } }
        guard let url = components.url else { throw QuantAntClientError.invalidResponse }
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.httpBody = body
        request.timeoutInterval = 20
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if body != nil { request.setValue("application/json", forHTTPHeaderField: "Content-Type") }
        headers.forEach { if let value = $0.value { request.setValue(value, forHTTPHeaderField: $0.key) } }
        do {
            let (data, response) = try await session.data(for: request)
            guard let response = response as? HTTPURLResponse else { throw QuantAntClientError.invalidResponse }
            if response.statusCode == 401 { throw QuantAntClientError.unauthorized }
            guard (200...299).contains(response.statusCode) else {
                if let error = try? decoder.decode(QuantAntAPIErrorDTO.self, from: data) {
                    throw QuantAntClientError.server(error)
                }
                throw QuantAntClientError.invalidResponse
            }
            if T.self == QuantAntEmptyResponse.self && data.isEmpty { return QuantAntEmptyResponse() as! T }
            return try decoder.decode(T.self, from: data)
        } catch let error as URLError where error.code == .notConnectedToInternet || error.code == .networkConnectionLost {
            throw QuantAntClientError.offline
        }
    }

    private static func makeDecoder() -> JSONDecoder {
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let value = try container.decode(String.self)
            let fractional = ISO8601DateFormatter()
            fractional.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            if let date = fractional.date(from: value) { return date }
            let plain = ISO8601DateFormatter()
            guard let date = plain.date(from: value) else {
                throw DecodingError.dataCorruptedError(in: container, debugDescription: "Invalid RFC3339 timestamp")
            }
            return date
        }
        return decoder
    }
}

private struct ClosePositionBody: Encodable { let accountID: String; let quantity: String? }
private struct QuantAntEmptyResponse: Decodable { init() {} }

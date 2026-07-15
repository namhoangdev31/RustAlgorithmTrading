import Foundation

enum QuantAntTradingMode: String, Codable, CaseIterable, Hashable {
    case paper
    case live
}

enum QuantAntSupportLevel: String, Codable, Hashable {
    case unavailable
    case viewOnly = "view_only"
    case paper
    case live
}

enum QuantAntSurfaceState: String, Codable, Hashable {
    case loading
    case loaded
    case empty
    case stale
    case offline
    case unauthorized
    case unsupportedCapability = "unsupported_capability"
    case recoverableError = "recoverable_error"
    case fatalError = "fatal_error"
}

struct QuantAntSnapshot<Value: Codable & Sendable>: Codable, Sendable {
    let state: QuantAntSurfaceState
    let asOf: Date
    let sequence: Int64?
    let data: Value
    let nextCursor: String?
    let requiredCapability: String?
}

struct QuantAntBootstrapDTO: Codable, Sendable {
    let enabled: Bool
    let defaultMode: QuantAntTradingMode
    let liveEnabled: Bool
    let strategyLiveEnabled: Bool
    let liveSessionTTLSeconds: Int
    let limits: [String: Int]
    let capabilities: JSONValue
    let endpoints: [String: String]
    let accounts: [QuantAntAccountSummaryDTO]
}

struct QuantAntAccountSummaryDTO: Codable, Identifiable, Hashable, Sendable {
    let id: String
    let displayName: String
    let provider: String
    let baseCurrency: String
}

struct QuantAntInstrumentDTO: Codable, Identifiable, Hashable, Sendable {
    let id: String
    let provider: String
    let providerSymbol: String
    let canonicalSymbol: String
    let displayName: String
    let assetClass: String
    let exchange: String?
    let currency: String
    let timezone: String
    let priceScale: Int
    let quantityScale: Int
    let marketDataLevel: QuantAntSupportLevel
    let executionLevel: QuantAntSupportLevel
    let capabilities: JSONValue

    var canPaperTrade: Bool { executionLevel == .paper || executionLevel == .live }
    var canLiveTrade: Bool { executionLevel == .live }
}

struct QuantAntCandleDTO: Codable, Identifiable, Hashable, Sendable {
    let timestamp: Date
    let open: String
    let high: String
    let low: String
    let close: String
    let volume: String

    var id: Date { timestamp }
    var closeValue: Double { Double(close) ?? 0 }
}

struct QuantAntPortfolioDTO: Codable, Hashable, Sendable {
    let accountID: String
    let currency: String
    let equity: String
    let cash: String
    let buyingPower: String
    let marginUsed: String
    let realizedPnL: String
    let unrealizedPnL: String
}

struct QuantAntPositionDTO: Codable, Identifiable, Hashable, Sendable {
    let id: String
    let accountID: String
    let instrumentID: String
    let symbol: String
    let mode: QuantAntTradingMode
    let quantity: String
    let averagePrice: String
    let realizedPnL: String
    let reconciledAt: Date
}

struct QuantAntOrderDTO: Codable, Identifiable, Hashable, Sendable {
    let id: String
    let accountID: String
    let instrumentID: String
    let symbol: String
    let clientOrderID: String
    let brokerOrderID: String?
    let mode: QuantAntTradingMode
    let side: String
    let orderType: String
    let timeInForce: String
    let quantity: String
    let limitPrice: String?
    let stopPrice: String?
    let takeProfitPrice: String?
    let stopLossPrice: String?
    let trailValue: String?
    let status: String
    let version: Int
    let createdAt: Date
}

struct QuantAntRecordDTO: Codable, Identifiable, Hashable, Sendable {
    let id: String
    let status: String?
    let name: String?
    let payload: JSONValue?
    let createdAt: Date
}

struct QuantAntStrategyTemplateDTO: Codable, Identifiable, Hashable, Sendable {
    let key: String
    let schemaVersion: Int
    let displayName: [String: String]
    let parametersSchema: JSONValue
    var id: String { key }
}

struct QuantAntCreateOrderRequest: Codable, Hashable, Sendable {
    let accountID: String
    let instrumentID: String
    let mode: QuantAntTradingMode
    let side: String
    let orderType: String
    let timeInForce: String
    let quantity: String
    let limitPrice: String?
    let stopPrice: String?
    let takeProfitPrice: String?
    let stopLossPrice: String?
    let trailValue: String?
    let strategyVersionHash: String?
}

struct QuantAntAPIErrorDTO: Codable, Error, Sendable {
    let code: String
    let message: String
    let correlationID: String?
    let retryable: Bool
    let fieldErrors: [JSONValue]
    let requiredCapability: String?
}

enum JSONValue: Codable, Hashable, Sendable {
    case string(String)
    case number(Double)
    case bool(Bool)
    case object([String: JSONValue])
    case array([JSONValue])
    case null

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() { self = .null }
        else if let value = try? container.decode(Bool.self) { self = .bool(value) }
        else if let value = try? container.decode(Double.self) { self = .number(value) }
        else if let value = try? container.decode(String.self) { self = .string(value) }
        else if let value = try? container.decode([String: JSONValue].self) { self = .object(value) }
        else { self = .array(try container.decode([JSONValue].self)) }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .string(let value): try container.encode(value)
        case .number(let value): try container.encode(value)
        case .bool(let value): try container.encode(value)
        case .object(let value): try container.encode(value)
        case .array(let value): try container.encode(value)
        case .null: try container.encodeNil()
        }
    }
}

import Foundation
import Observation

enum QuantAntViewState: Equatable {
    case idle
    case loading
    case loaded
    case empty
    case stale
    case offline
    case unauthorized
    case unsupported(String)
    case error(message: String, retryable: Bool)
}

@Observable @MainActor
final class QuantAntStore {
    private let client: QuantAntAPIClient
    private let cache: QuantAntCache
    private let webSocket: QuantAntWebSocketClient

    @ObservationIgnored private var eventTask: Task<Void, Never>?

    var state: QuantAntViewState = .idle
    var bootstrap: QuantAntBootstrapDTO?
    var selectedAccountID: String?
    var mode: QuantAntTradingMode = .paper
    var lastEventSequence: Int64?
    var lastEventAt: Date?

    let markets: QuantAntMarketStore
    let portfolio: QuantAntPortfolioStore
    let strategies: QuantAntStrategyStore
    let riskAndAlerts: QuantAntRiskAlertStore
    let trading: QuantAntTradingStore

    init(client: QuantAntAPIClient, cache: QuantAntCache, webSocket: QuantAntWebSocketClient) {
        self.client = client
        self.cache = cache
        self.webSocket = webSocket
        markets = QuantAntMarketStore(client: client, cache: cache)
        portfolio = QuantAntPortfolioStore(client: client, cache: cache)
        strategies = QuantAntStrategyStore(client: client, cache: cache)
        riskAndAlerts = QuantAntRiskAlertStore(client: client, cache: cache)
        trading = QuantAntTradingStore(client: client)
    }

    func load() async {
        guard state != .loading else { return }
        state = .loading
        do {
            let snapshot = try await client.bootstrap()
            bootstrap = snapshot.data
            selectedAccountID = try cache.preference(key: "selected_account_id")
                ?? snapshot.data.accounts.first?.id
            if let selectedAccountID { try? cache.setPreference(selectedAccountID, key: "selected_account_id") }
            state = mapped(snapshot.state, isEmpty: false, capability: snapshot.requiredCapability)
            async let marketLoad: Void = markets.load()
            if let accountID = selectedAccountID {
                async let portfolioLoad: Void = portfolio.load(accountID: accountID, mode: mode)
                async let strategyLoad: Void = strategies.load(accountID: accountID)
                async let alertLoad: Void = riskAndAlerts.load(accountID: accountID)
                _ = await (portfolioLoad, strategyLoad, alertLoad)
            }
            _ = await marketLoad
            connectEvents()
        } catch {
            state = errorState(error)
        }
    }

    private func connectEvents() {
        guard eventTask == nil else { return }
        eventTask = Task { [weak self] in
            guard let self else { return }
            do {
                for try await event in await webSocket.events(resumeSequence: lastEventSequence) {
                    guard !Task.isCancelled else { return }
                    let now = Date()
                    if let lastEventAt, now.timeIntervalSince(lastEventAt) < 0.25 {
                        try? await Task.sleep(for: .milliseconds(250))
                    }
                    lastEventSequence = event.sequence
                    lastEventAt = now
                    if event.type.hasPrefix("order.") || event.type.hasPrefix("position.") {
                        if let accountID = selectedAccountID {
                            await portfolio.load(accountID: accountID, mode: mode)
                        }
                    }
                }
            } catch {
                eventTask = nil
            }
        }
    }

    func selectAccount(_ id: String) async {
        selectedAccountID = id
        try? cache.setPreference(id, key: "selected_account_id")
        async let portfolioLoad: Void = portfolio.load(accountID: id, mode: mode)
        async let strategyLoad: Void = strategies.load(accountID: id)
        async let alertLoad: Void = riskAndAlerts.load(accountID: id)
        _ = await (portfolioLoad, strategyLoad, alertLoad)
    }

    func setMode(_ newMode: QuantAntTradingMode) async {
        guard newMode == .paper || bootstrap?.liveEnabled == true else { return }
        mode = newMode
        if let accountID = selectedAccountID { await portfolio.load(accountID: accountID, mode: newMode) }
    }
}

@Observable @MainActor
final class QuantAntMarketStore {
    private let client: QuantAntAPIClient
    private let cache: QuantAntCache
    var state: QuantAntViewState = .idle
    var instruments: [QuantAntInstrumentDTO] = []
    var visibleInstruments: [QuantAntInstrumentDTO] = []
    var candles: [QuantAntCandleDTO] = []
    var candleState: QuantAntViewState = .idle
    var searchText = "" { didSet { updateVisible() } }
    var assetClass = "all" { didSet { updateVisible() } }

    init(client: QuantAntAPIClient, cache: QuantAntCache) { self.client = client; self.cache = cache }

    func load() async {
        state = .loading
        do {
            let snapshot = try await client.instruments()
            instruments = snapshot.data
            updateVisible()
            state = mapped(snapshot.state, isEmpty: instruments.isEmpty, capability: snapshot.requiredCapability)
            try? cache.save(instruments, key: "instruments", maxAge: 60)
        } catch {
            if let cached = try? cache.load([QuantAntInstrumentDTO].self, key: "instruments") {
                instruments = cached.value
                updateVisible()
                state = cached.isStale ? .stale : .offline
            } else { state = errorState(error) }
        }
    }

    func loadCandles(instrumentID: String) async {
        candleState = .loading
        do {
            let snapshot = try await client.candles(instrumentID: instrumentID)
            candles = downsample(snapshot.data, maximum: 400)
            candleState = mapped(snapshot.state, isEmpty: candles.isEmpty, capability: snapshot.requiredCapability)
            try? cache.save(candles, key: "candles.\(instrumentID)", maxAge: 15)
        } catch {
            if let cached = try? cache.load([QuantAntCandleDTO].self, key: "candles.\(instrumentID)") {
                candles = cached.value
                candleState = cached.isStale ? .stale : .offline
            } else { candleState = errorState(error) }
        }
    }

    private func updateVisible() {
        let query = searchText.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        visibleInstruments = instruments.filter { instrument in
            (assetClass == "all" || instrument.assetClass == assetClass)
                && (query.isEmpty || instrument.canonicalSymbol.lowercased().contains(query)
                    || instrument.displayName.lowercased().contains(query))
        }
    }

    private func downsample(_ values: [QuantAntCandleDTO], maximum: Int) -> [QuantAntCandleDTO] {
        guard values.count > maximum else { return values }
        let stride = max(1, values.count / maximum)
        return values.enumerated().compactMap { $0.offset % stride == 0 ? $0.element : nil }
    }
}

@Observable @MainActor
final class QuantAntPortfolioStore {
    private let client: QuantAntAPIClient
    private let cache: QuantAntCache
    var state: QuantAntViewState = .idle
    var portfolio: QuantAntPortfolioDTO?
    var positions: [QuantAntPositionDTO] = []
    var orders: [QuantAntOrderDTO] = []
    var openOrders: [QuantAntOrderDTO] = []
    var historyOrders: [QuantAntOrderDTO] = []

    init(client: QuantAntAPIClient, cache: QuantAntCache) { self.client = client; self.cache = cache }

    func load(accountID: String, mode: QuantAntTradingMode) async {
        state = .loading
        do {
            async let portfolioSnapshot = client.portfolio(accountID: accountID, mode: mode)
            async let positionSnapshot = client.positions(accountID: accountID)
            async let orderSnapshot = client.orders(accountID: accountID)
            let result = try await (portfolioSnapshot, positionSnapshot, orderSnapshot)
            portfolio = result.0.data
            positions = result.1.data
            orders = result.2.data
            openOrders = orders.filter { ["pending", "accepted", "partially_filled"].contains($0.status) }
            historyOrders = orders.filter { !["pending", "accepted", "partially_filled"].contains($0.status) }
            state = .loaded
            try? cache.save(result.0.data, key: "portfolio.\(accountID).\(mode.rawValue)", maxAge: 15)
            try? cache.save(positions, key: "positions.\(accountID)", maxAge: 15)
            try? cache.save(orders, key: "orders.\(accountID)", maxAge: 15)
        } catch {
            let cachedPortfolio = try? cache.load(QuantAntPortfolioDTO.self, key: "portfolio.\(accountID).\(mode.rawValue)")
            portfolio = cachedPortfolio?.value
            positions = (try? cache.load([QuantAntPositionDTO].self, key: "positions.\(accountID)"))?.value ?? []
            orders = (try? cache.load([QuantAntOrderDTO].self, key: "orders.\(accountID)"))?.value ?? []
            openOrders = orders.filter { ["pending", "accepted", "partially_filled"].contains($0.status) }
            historyOrders = orders.filter { !["pending", "accepted", "partially_filled"].contains($0.status) }
            state = portfolio == nil ? errorState(error) : .offline
        }
    }

    func cancel(order: QuantAntOrderDTO) async throws {
        try await client.cancelOrder(id: order.id, accountID: order.accountID)
        await load(accountID: order.accountID, mode: order.mode)
    }

    func close(position: QuantAntPositionDTO, quantity: String? = nil) async throws {
        try await client.closePosition(symbol: position.symbol, accountID: position.accountID, quantity: quantity)
        await load(accountID: position.accountID, mode: position.mode)
    }
}

@Observable @MainActor
final class QuantAntStrategyStore {
    private let client: QuantAntAPIClient
    private let cache: QuantAntCache
    var state: QuantAntViewState = .idle
    var templates: [QuantAntStrategyTemplateDTO] = []
    var strategies: [QuantAntRecordDTO] = []
    var backtests: [QuantAntRecordDTO] = []
    var deployments: [QuantAntRecordDTO] = []

    init(client: QuantAntAPIClient, cache: QuantAntCache) { self.client = client; self.cache = cache }

    func load(accountID: String) async {
        state = .loading
        do {
            async let templateSnapshot = client.strategyTemplates()
            async let strategySnapshot = client.records(path: "strategies", accountID: accountID)
            async let backtestSnapshot = client.records(path: "backtests", accountID: accountID)
            async let deploymentSnapshot = client.records(path: "deployments", accountID: accountID)
            let result = try await (templateSnapshot, strategySnapshot, backtestSnapshot, deploymentSnapshot)
            templates = result.0.data
            strategies = result.1.data
            backtests = result.2.data
            deployments = result.3.data
            state = strategies.isEmpty && backtests.isEmpty && deployments.isEmpty ? .empty : .loaded
            try? cache.save(templates, key: "strategy_templates", maxAge: 3600)
        } catch { state = errorState(error) }
    }
}

@Observable @MainActor
final class QuantAntRiskAlertStore {
    private let client: QuantAntAPIClient
    private let cache: QuantAntCache
    var state: QuantAntViewState = .idle
    var alerts: [QuantAntRecordDTO] = []
    var auditEvents: [QuantAntRecordDTO] = []

    init(client: QuantAntAPIClient, cache: QuantAntCache) { self.client = client; self.cache = cache }

    func load(accountID: String) async {
        state = .loading
        do {
            async let alertSnapshot = client.records(path: "alerts", accountID: accountID)
            async let auditSnapshot = client.records(path: "audit-events", accountID: accountID)
            let result = try await (alertSnapshot, auditSnapshot)
            alerts = result.0.data
            auditEvents = result.1.data
            state = alerts.isEmpty ? .empty : .loaded
            try? cache.save(alerts, key: "alerts.\(accountID)", maxAge: 30)
        } catch { state = errorState(error) }
    }
}

@Observable @MainActor
final class QuantAntTradingStore {
    private let client: QuantAntAPIClient
    var state: QuantAntViewState = .idle
    var lastOrder: QuantAntOrderDTO?

    init(client: QuantAntAPIClient) { self.client = client }

    func submit(_ request: QuantAntCreateOrderRequest, liveSession: String? = nil) async {
        state = .loading
        do {
            lastOrder = try await client.submitOrder(request, liveSession: liveSession)
            state = .loaded
        } catch { state = errorState(error) }
    }
}

@MainActor
private func mapped(_ state: QuantAntSurfaceState, isEmpty: Bool, capability: String?) -> QuantAntViewState {
    switch state {
    case .loaded: return isEmpty ? .empty : .loaded
    case .empty: return .empty
    case .stale: return .stale
    case .offline: return .offline
    case .unauthorized: return .unauthorized
    case .unsupportedCapability: return .unsupported(capability ?? "unknown")
    case .recoverableError: return .error(message: "Temporary service error", retryable: true)
    case .fatalError: return .error(message: "Service unavailable", retryable: false)
    case .loading: return .loading
    }
}

@MainActor
private func errorState(_ error: Error) -> QuantAntViewState {
    switch error {
    case QuantAntClientError.unauthorized: return .unauthorized
    case QuantAntClientError.offline: return .offline
    case QuantAntClientError.server(let value):
        if let capability = value.requiredCapability, !capability.isEmpty { return .unsupported(capability) }
        return .error(message: value.message, retryable: value.retryable)
    default: return .error(message: error.localizedDescription, retryable: true)
    }
}

import ExploreSwiftUI
import SwiftUI

struct QuantAntDestinationView: View {
    let route: QuantAntRoute
    let store: QuantAntStore

    @ViewBuilder var body: some View {
        switch route {
        case .commandCenter:
            QuantAntView(store: store)
        case .marketExplorer:
            QuantAntMarketExplorerView(store: store.markets)
        case .instrument(let id):
            if let instrument = store.markets.instruments.first(where: { $0.id == id }) {
                QuantAntInstrumentDetailView(instrument: instrument, store: store.markets)
            } else { missing("Instrument") }
        case .intelligence:
            QuantAntIntelligenceView()
        case .article:
            unsupported("Article detail", capability: "intelligence.news")
        case .economicCalendar:
            QuantAntEconomicCalendarView()
        case .orderTicket(let instrumentID):
            QuantAntOrderTicketView(root: store, initialInstrumentID: instrumentID)
        case .orderReview(let request):
            QuantAntOrderReviewView(request: request, store: store.trading)
        case .orders:
            QuantAntOrdersView(store: store.portfolio)
        case .order(let id):
            if let order = store.portfolio.orders.first(where: { $0.id == id }) {
                QuantAntOrderDetailView(order: order, store: store.portfolio)
            } else { missing("Order") }
        case .positions:
            QuantAntPositionsView(store: store.portfolio)
        case .position(let id):
            if let position = store.portfolio.positions.first(where: { $0.id == id }) {
                QuantAntPositionDetailView(position: position, store: store.portfolio)
            } else { missing("Position") }
        case .portfolio:
            QuantAntPortfolioView(store: store.portfolio)
        case .strategies:
            QuantAntStrategiesView(store: store.strategies)
        case .strategy(let id):
            if let record = store.strategies.strategies.first(where: { $0.id == id }) {
                QuantAntStrategyDetailView(record: record)
            } else { missing("Strategy") }
        case .strategyEditor(let id):
            QuantAntStrategyEditorView(
                template: store.strategies.templates.first(where: { $0.key == id }),
                sourceID: id
            )
        case .backtestSetup(let id):
            QuantAntBacktestSetupView(strategyID: id)
        case .backtest(let id):
            QuantAntBacktestDetailView(record: store.strategies.backtests.first(where: { $0.id == id }))
        case .backtestCompare:
            QuantAntBacktestCompareView(records: store.strategies.backtests)
        case .deployments:
            QuantAntDeploymentsView(records: store.strategies.deployments)
        case .deployment(let id):
            if let record = store.strategies.deployments.first(where: { $0.id == id }) {
                QuantAntDeploymentDetailView(record: record)
            } else { missing("Deployment") }
        case .riskCenter:
            QuantAntRiskCenterView(root: store)
        case .riskPolicy:
            QuantAntRiskPolicyView()
        case .incident(let id):
            QuantAntIncidentView(id: id)
        case .alerts:
            QuantAntAlertsView(store: store.riskAndAlerts)
        case .alert(let id):
            if let alert = store.riskAndAlerts.alerts.first(where: { $0.id == id }) {
                QuantAntAlertDetailView(alert: alert)
            } else { missing("Alert") }
        case .systemHealth:
            QuantAntSystemHealthView(root: store)
        case .auditLog:
            QuantAntAuditLogView(records: store.riskAndAlerts.auditEvents)
        case .preferences:
            QuantAntPreferencesView()
        case .liveUnlock:
            QuantAntLiveUnlockView()
        }
    }

    private func missing(_ title: String) -> some View {
        ContentUnavailableView("\(title) not found", systemImage: "questionmark.folder")
    }

    private func unsupported(_ title: String, capability: String) -> some View {
        ContentUnavailableView(
            title,
            systemImage: "exclamationmark.shield",
            description: Text("Required capability: \(capability)")
        )
    }
}

import Foundation

enum QuantAntRoute: Hashable {
    case commandCenter
    case marketExplorer
    case instrument(String)
    case intelligence
    case article(String)
    case economicCalendar
    case orderTicket(String?)
    case orderReview(QuantAntCreateOrderRequest)
    case orders
    case order(String)
    case positions
    case position(String)
    case portfolio
    case strategies
    case strategy(String)
    case strategyEditor(String?)
    case backtestSetup(String)
    case backtest(String)
    case backtestCompare
    case deployments
    case deployment(String)
    case riskCenter
    case riskPolicy
    case incident(String)
    case alerts
    case alert(String)
    case systemHealth
    case auditLog
    case preferences
    case liveUnlock

    var id: String {
        switch self {
        case .commandCenter: "command-center"
        case .marketExplorer: "market-explorer"
        case .instrument(let id): "instrument-\(id)"
        case .intelligence: "intelligence"
        case .article(let id): "article-\(id)"
        case .economicCalendar: "economic-calendar"
        case .orderTicket(let id): "order-ticket-\(id ?? "new")"
        case .orderReview(let order): "order-review-\(order.hashValue)"
        case .orders: "orders"
        case .order(let id): "order-\(id)"
        case .positions: "positions"
        case .position(let id): "position-\(id)"
        case .portfolio: "portfolio"
        case .strategies: "strategies"
        case .strategy(let id): "strategy-\(id)"
        case .strategyEditor(let id): "strategy-editor-\(id ?? "new")"
        case .backtestSetup(let id): "backtest-setup-\(id)"
        case .backtest(let id): "backtest-\(id)"
        case .backtestCompare: "backtest-compare"
        case .deployments: "deployments"
        case .deployment(let id): "deployment-\(id)"
        case .riskCenter: "risk-center"
        case .riskPolicy: "risk-policy"
        case .incident(let id): "incident-\(id)"
        case .alerts: "alerts"
        case .alert(let id): "alert-\(id)"
        case .systemHealth: "system-health"
        case .auditLog: "audit-log"
        case .preferences: "preferences"
        case .liveUnlock: "live-unlock"
        }
    }
}

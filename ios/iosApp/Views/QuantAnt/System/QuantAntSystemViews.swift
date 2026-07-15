import ExploreSwiftUI
import SwiftUI

struct QuantAntSystemHealthView: View {
    let root: QuantAntStore

    var body: some View {
        UniList {
            component("Control plane", state: root.state)
            component("Market data", state: root.markets.state)
            component("Portfolio", state: root.portfolio.state)
            component("Strategy worker", state: root.strategies.state)
            component("Alerts", state: root.riskAndAlerts.state)
            Section("Connectivity") {
                Text("Broker/feed/worker health is shown only when /health/components is enabled.")
                    .font(.footnote).uniForegroundStyle(.secondary)
            }
        }
        .uniNavigationTitle("System health")
    }

    private func component(_ name: String, state: QuantAntViewState) -> some View {
        HStack {
            Text(name)
            Spacer()
            QuantAntStatusBadge(title: status(state), color: color(state))
        }
    }

    private func status(_ state: QuantAntViewState) -> String {
        switch state {
        case .loaded: "healthy"
        case .loading: "loading"
        case .offline: "offline"
        case .stale: "stale"
        case .empty: "empty"
        default: "degraded"
        }
    }

    private func color(_ state: QuantAntViewState) -> Color {
        state == .loaded ? QuantAntTheme.positive : state == .offline ? QuantAntTheme.negative : .orange
    }
}

struct QuantAntAuditLogView: View {
    let records: [QuantAntRecordDTO]

    var body: some View {
        UniList(records) { record in
            VStack(alignment: .leading, spacing: 5) {
                Text(record.status ?? "audit.event").font(.headline)
                Text(record.name ?? record.id).font(.caption.monospaced()).uniForegroundStyle(.secondary)
                Text(record.createdAt.formatted()).font(.caption2).uniForegroundStyle(.secondary)
            }
            .accessibilityElement(children: .combine)
        }
        .overlay { if records.isEmpty { ContentUnavailableView("No audit events", systemImage: "checkmark.seal") } }
        .uniNavigationTitle("Audit log")
    }
}


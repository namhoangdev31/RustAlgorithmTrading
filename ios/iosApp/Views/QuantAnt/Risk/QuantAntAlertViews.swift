import ExploreSwiftUI
import SwiftUI

struct QuantAntAlertsView: View {
    @EnvironmentObject private var navigation: NavigationViewModel
    let store: QuantAntRiskAlertStore

    var body: some View {
        QuantAntStateView(state: store.state, retry: nil) {
            UniList(store.alerts) { alert in
                UniButton { navigation.navigate(to: .quantAnt(.alert(alert.id))) } label: {
                    HStack {
                        Image(systemName: "exclamationmark.triangle.fill").uniForegroundStyle(.orange)
                        VStack(alignment: .leading) {
                            Text(alert.name ?? "Alert").font(.headline)
                            Text(alert.status ?? "info").font(.caption).uniForegroundStyle(.secondary)
                        }
                        Spacer()
                        Text(alert.createdAt, style: .relative).font(.caption2)
                    }
                }
                .uniButtonStyle(.plain)
            }
        }
        .uniNavigationTitle("Alerts")
    }
}

struct QuantAntAlertDetailView: View {
    let alert: QuantAntRecordDTO

    var body: some View {
        Form {
            Section("Alert") {
                LabeledContent("Title", value: alert.name ?? "Alert")
                LabeledContent("Severity", value: alert.status ?? "unknown")
                LabeledContent("Created", value: alert.createdAt.formatted())
            }
            Section("Details") { Text(String(describing: alert.payload)) }
            Section("Actions") {
                UniButton("Acknowledge") {}.disabled(true)
                UniButton("Open linked incident") {}.disabled(true)
            }
        }
        .uniNavigationTitle("Alert")
    }
}


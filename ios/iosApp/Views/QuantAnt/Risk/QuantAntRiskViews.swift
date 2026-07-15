import ExploreSwiftUI
import SwiftUI

struct QuantAntRiskCenterView: View {
    @EnvironmentObject private var navigation: NavigationViewModel
    let root: QuantAntStore

    var body: some View {
        UniList {
            Section("Risk posture") {
                LabeledContent("Open positions", value: "\(root.portfolio.positions.count)")
                LabeledContent("Open orders", value: "\(root.portfolio.openOrders.count)")
                LabeledContent("Active alerts", value: "\(root.riskAndAlerts.alerts.count)")
                LabeledContent("Mode", value: root.mode.rawValue.uppercased())
                LabeledContent("Safety") {
                    QuantAntStatusBadge(title: "Fail closed", color: QuantAntTheme.teal)
                }
            }
            Section("Controls") {
                route("Exposure, drawdown & concentration", "chart.pie", .riskPolicy)
                route("Risk policy versions", "clock.arrow.circlepath", .riskPolicy)
                route("Circuit breaker incidents", "exclamationmark.shield", .incident("latest"))
            }
            Section("Emergency") {
                UniButton("Emergency kill switch", role: .destructive) {
                    navigation.navigate(to: .quantAnt(.liveUnlock))
                }
                .uniButtonStyle(.borderedProminent)
                Text("Cancel orders and close positions remain available after the circuit breaker opens.")
                    .font(.footnote).uniForegroundStyle(.secondary)
            }
        }
        .uniNavigationTitle("Risk Center")
    }

    private func route(_ title: String, _ icon: String, _ route: QuantAntRoute) -> some View {
        QuantAntNavigationRow(title: title, systemImage: icon) {
            navigation.navigate(to: .quantAnt(route))
        }
    }
}

struct QuantAntRiskPolicyView: View {
    var body: some View {
        Form {
            Section("Current policy") {
                ContentUnavailableView(
                    "Risk policy read model unavailable",
                    systemImage: "shield.slash",
                    description: Text("The control-plane returned required_capability risk.policy.read_model.")
                )
            }
            Section("Policy workflow") {
                Label("Every change creates an immutable version", systemImage: "clock.arrow.circlepath")
                Label("Increasing limits requires biometric step-up", systemImage: "faceid")
                Label("If-Match prevents concurrent updates", systemImage: "arrow.triangle.2.circlepath")
            }
        }
        .uniNavigationTitle("Risk policy")
    }
}

struct QuantAntIncidentView: View {
    let id: String

    var body: some View {
        Form {
            Section("Incident") {
                LabeledContent("ID", value: id)
                LabeledContent("Circuit breaker", value: "Unknown")
                LabeledContent("Kill switch", value: "Protected")
            }
            Section("Recovery") {
                UniButton("Reset circuit breaker") {}.disabled(true)
                Text("Reset remains disabled until a valid live step-up session and audit endpoint are available.")
                    .font(.footnote).uniForegroundStyle(.secondary)
            }
        }
        .uniNavigationTitle("Risk incident")
    }
}

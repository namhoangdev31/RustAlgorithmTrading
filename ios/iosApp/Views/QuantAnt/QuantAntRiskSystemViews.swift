import DeviceCheck
import LocalAuthentication
import Observation
import SwiftUI

struct QuantAntRiskCenterView: View {
    @EnvironmentObject private var navigation: NavigationViewModel
    let root: QuantAntStore

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 16) {
                HStack {
                    Text("Risk posture").font(.title2.bold())
                    Spacer()
                    QuantAntStatusBadge(title: "Fail closed", color: QuantAntTheme.teal)
                }
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                    QuantAntMetricCard(title: "Open positions", value: "\(root.portfolio.positions.count)", systemImage: "square.stack.3d.up")
                    QuantAntMetricCard(title: "Open orders", value: "\(root.portfolio.openOrders.count)", systemImage: "list.number")
                    QuantAntMetricCard(title: "Active alerts", value: "\(root.riskAndAlerts.alerts.count)", systemImage: "bell.badge", tint: .orange)
                    QuantAntMetricCard(title: "Mode", value: root.mode.rawValue.uppercased(), systemImage: "shield")
                }
                route("Exposure, drawdown & concentration", .riskPolicy)
                route("Risk policy versions", .riskPolicy)
                route("Circuit breaker incidents", .incident("latest"))
                Button("Emergency kill switch", role: .destructive) {
                    navigation.navigate(to: .quantAnt(.liveUnlock))
                }
                .buttonStyle(.borderedProminent)
                Text("Cancel orders and close positions remain available after the circuit breaker opens.")
                    .font(.footnote).foregroundStyle(.secondary)
            }
            .padding()
        }
        .navigationTitle("Risk Center")
    }

    private func route(_ title: String, _ route: QuantAntRoute) -> some View {
        Button { navigation.navigate(to: .quantAnt(route)) } label: {
            HStack { Text(title); Spacer(); Image(systemName: "chevron.right") }
                .padding().background(.background, in: RoundedRectangle(cornerRadius: 14))
        }
        .buttonStyle(.plain)
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
        .navigationTitle("Risk policy")
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
                Button("Reset circuit breaker") {}.disabled(true)
                Text("Reset remains disabled until a valid live step-up session and audit endpoint are available.")
                    .font(.footnote).foregroundStyle(.secondary)
            }
        }
        .navigationTitle("Risk incident")
    }
}

struct QuantAntAlertsView: View {
    @EnvironmentObject private var navigation: NavigationViewModel
    let store: QuantAntRiskAlertStore

    var body: some View {
        QuantAntStateView(state: store.state, retry: nil) {
            List(store.alerts) { alert in
                Button { navigation.navigate(to: .quantAnt(.alert(alert.id))) } label: {
                    HStack {
                        Image(systemName: "exclamationmark.triangle.fill").foregroundStyle(.orange)
                        VStack(alignment: .leading) {
                            Text(alert.name ?? "Alert").font(.headline)
                            Text(alert.status ?? "info").font(.caption).foregroundStyle(.secondary)
                        }
                        Spacer()
                        Text(alert.createdAt, style: .relative).font(.caption2)
                    }
                }
                .buttonStyle(.plain)
            }
        }
        .navigationTitle("Alerts")
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
                Button("Acknowledge") {}.disabled(true)
                Button("Open linked incident") {}.disabled(true)
            }
        }
        .navigationTitle("Alert")
    }
}

struct QuantAntSystemHealthView: View {
    let root: QuantAntStore

    var body: some View {
        List {
            component("Control plane", state: root.state)
            component("Market data", state: root.markets.state)
            component("Portfolio", state: root.portfolio.state)
            component("Strategy worker", state: root.strategies.state)
            component("Alerts", state: root.riskAndAlerts.state)
            Section("Connectivity") {
                Text("Broker/feed/worker health is shown only when /health/components is enabled.")
                    .font(.footnote).foregroundStyle(.secondary)
            }
        }
        .navigationTitle("System health")
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
        List(records) { record in
            VStack(alignment: .leading, spacing: 5) {
                Text(record.status ?? "audit.event").font(.headline)
                Text(record.name ?? record.id).font(.caption.monospaced()).foregroundStyle(.secondary)
                Text(record.createdAt.formatted()).font(.caption2).foregroundStyle(.secondary)
            }
            .accessibilityElement(children: .combine)
        }
        .overlay { if records.isEmpty { ContentUnavailableView("No audit events", systemImage: "checkmark.seal") } }
        .navigationTitle("Audit log")
    }
}

struct QuantAntIntelligenceView: View {
    @EnvironmentObject private var navigation: NavigationViewModel

    var body: some View {
        List {
            unsupported("News & article detail", "intelligence.news", "newspaper")
            unsupported("Ticker sentiment & reasoning", "intelligence.sentiment", "brain.head.profile")
            Button { navigation.navigate(to: .quantAnt(.economicCalendar)) } label: {
                Label("Economic calendar", systemImage: "calendar.badge.clock")
            }
        }
        .navigationTitle("Intelligence")
    }

    private func unsupported(_ title: String, _ capability: String, _ icon: String) -> some View {
        VStack(alignment: .leading) {
            Label(title, systemImage: icon)
            Text("Required: \(capability)").font(.caption).foregroundStyle(.secondary)
        }
    }
}

struct QuantAntEconomicCalendarView: View {
    var body: some View {
        ContentUnavailableView(
            "Economic calendar unavailable",
            systemImage: "calendar.badge.exclamationmark",
            description: Text("Trading Economics capability is not configured. Actual, forecast, previous, importance and revisions will appear here.")
        )
        .navigationTitle("Economic calendar")
    }
}

struct QuantAntPreferencesView: View {
    @AppStorage("quantant.chart.interval") private var interval = "1m"
    @AppStorage("quantant.notifications.risk") private var riskNotifications = true
    @AppStorage("quantant.reduce.motion") private var reduceMotion = false

    var body: some View {
        Form {
            Section("Charts") {
                Picker("Default interval", selection: $interval) {
                    Text("1m").tag("1m"); Text("5m").tag("5m"); Text("1d").tag("1d")
                }
            }
            Section("Notifications") { Toggle("Risk and execution alerts", isOn: $riskNotifications) }
            Section("Accessibility") { Toggle("Reduce QuantAnt motion", isOn: $reduceMotion) }
        }
        .navigationTitle("Preferences")
    }
}

@MainActor @Observable
final class QuantAntLiveUnlockModel {
    var state: QuantAntViewState = .idle

    func unlock() async {
        state = .loading
        let context = LAContext()
        var error: NSError?
        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
            state = .error(message: error?.localizedDescription ?? "Biometrics unavailable", retryable: false)
            return
        }
        do {
            let approved = try await context.evaluatePolicy(
                .deviceOwnerAuthenticationWithBiometrics,
                localizedReason: "Unlock a five-minute QuantAnt live session"
            )
            guard approved else { state = .unauthorized; return }
            guard DCAppAttestService.shared.isSupported else {
                state = .unsupported("security.app_attest")
                return
            }
            state = .unsupported("security.app_attest.server_verification")
        } catch {
            state = .error(message: error.localizedDescription, retryable: true)
        }
    }
}

struct QuantAntLiveUnlockView: View {
    @State private var model = QuantAntLiveUnlockModel()

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "faceid").font(.system(size: 64)).foregroundStyle(QuantAntTheme.indigo)
            Text("Live Session Unlock").font(.title.bold())
            Text("Live sessions are device-bound, biometric-protected and expire after five minutes.")
                .multilineTextAlignment(.center).foregroundStyle(.secondary)
            QuantAntStateView(state: model.state, retry: nil) { EmptyView() }
                .frame(maxHeight: 140)
            Button("Authenticate") { Task { await model.unlock() } }
                .buttonStyle(.borderedProminent)
                .disabled(model.state == .loading)
        }
        .padding()
        .navigationTitle("Live unlock")
    }
}

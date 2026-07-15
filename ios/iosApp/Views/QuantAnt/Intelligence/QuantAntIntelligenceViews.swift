import ExploreSwiftUI
import SwiftUI

struct QuantAntIntelligenceView: View {
    @EnvironmentObject private var navigation: NavigationViewModel

    var body: some View {
        UniList {
            unsupported("News & article detail", "intelligence.news", "newspaper")
            unsupported("Ticker sentiment & reasoning", "intelligence.sentiment", "brain.head.profile")
            UniButton { navigation.navigate(to: .quantAnt(.economicCalendar)) } label: {
                Label("Economic calendar", systemImage: "calendar.badge.clock")
            }
        }
        .uniNavigationTitle("Intelligence")
    }

    private func unsupported(_ title: String, _ capability: String, _ icon: String) -> some View {
        VStack(alignment: .leading) {
            Label(title, systemImage: icon)
            Text("Required: \(capability)").font(.caption).uniForegroundStyle(.secondary)
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
        .uniNavigationTitle("Economic calendar")
    }
}

struct QuantAntPreferencesView: View {
    @AppStorage("quantant.chart.interval") private var interval = "1m"
    @AppStorage("quantant.notifications.risk") private var riskNotifications = true
    @AppStorage("quantant.reduce.motion") private var reduceMotion = false

    var body: some View {
        Form {
            Section("Charts") {
                UniPicker("Default interval", selection: $interval) {
                    Text("1m").tag("1m"); Text("5m").tag("5m"); Text("1d").tag("1d")
                }
            }
            Section("Notifications") { Toggle("Risk and execution alerts", isOn: $riskNotifications) }
            Section("Accessibility") { Toggle("Reduce QuantAnt motion", isOn: $reduceMotion) }
        }
        .uniNavigationTitle("Preferences")
    }
}


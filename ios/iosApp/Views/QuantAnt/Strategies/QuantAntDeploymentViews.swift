import ExploreSwiftUI
import SwiftUI

struct QuantAntDeploymentsView: View {
    @EnvironmentObject private var navigation: NavigationViewModel
    let records: [QuantAntRecordDTO]

    var body: some View {
        UniList(records) { record in
            UniButton { navigation.navigate(to: .quantAnt(.deployment(record.id))) } label: {
                QuantAntRecordRow(record: record, icon: "bolt.horizontal.circle")
            }
            .uniButtonStyle(.plain)
        }
        .overlay {
            if records.isEmpty { ContentUnavailableView("No deployments", systemImage: "bolt.slash") }
        }
        .uniNavigationTitle("Deployments")
    }
}

struct QuantAntDeploymentDetailView: View {
    let record: QuantAntRecordDTO

    var body: some View {
        Form {
            Section("Runtime") {
                LabeledContent("Deployment", value: record.id)
                LabeledContent("Status", value: record.status ?? "unknown")
                LabeledContent("Last update", value: record.createdAt.formatted())
            }
            Section("Live monitor") {
                LabeledContent("Signals", value: "—")
                LabeledContent("Orders", value: "—")
                LabeledContent("P&L", value: "—")
            }
            Section("Controls") {
                UniButton("Pause") {}.disabled(true)
                UniButton("Resume") {}.disabled(true)
                UniButton("Stop", role: .destructive) {}.disabled(true)
                Text("Controls require versioned deployment command endpoints.")
                    .font(.footnote).uniForegroundStyle(.secondary)
            }
            Section("Version history & rollback") {
                ContentUnavailableView("No prior versions", systemImage: "clock.arrow.circlepath")
            }
        }
        .uniNavigationTitle("Deployment")
    }
}

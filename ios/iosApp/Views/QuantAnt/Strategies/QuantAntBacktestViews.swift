import ExploreSwiftUI
import SwiftUI

struct QuantAntBacktestSetupView: View {
    @EnvironmentObject private var navigation: NavigationViewModel
    let strategyID: String
    @State private var interval = "1m"
    @State private var capital = "10000"
    @State private var seed = "42"

    var body: some View {
        Form {
            Section("Dataset") {
                LabeledContent("Strategy version", value: strategyID)
                UniPicker("Interval", selection: $interval) {
                    Text("1 minute").tag("1m")
                    Text("5 minutes").tag("5m")
                    Text("1 day").tag("1d")
                }
                DatePicker("From", selection: .constant(Date().addingTimeInterval(-2_592_000)), displayedComponents: .date)
                DatePicker("To", selection: .constant(Date()), displayedComponents: .date)
            }
            Section("Reproducibility") {
                TextField("Initial capital", text: $capital).keyboardType(.decimalPad)
                TextField("Seed", text: $seed).keyboardType(.numberPad)
                Label("Dataset hash and risk snapshot are locked at submission", systemImage: "lock.doc")
                    .font(.footnote)
            }
            Section {
                UniButton("Queue backtest") { navigation.navigate(to: .quantAnt(.backtest("pending"))) }
                    .disabled(Int(seed) == nil || Decimal(string: capital).map { $0 <= 0 } ?? true)
            }
        }
        .uniNavigationTitle("Backtest setup")
    }
}

struct QuantAntBacktestDetailView: View {
    let record: QuantAntRecordDTO?

    var body: some View {
        Form {
            Section("Run") {
                LabeledContent("Run ID", value: record?.id ?? "Pending")
                LabeledContent("Status", value: record?.status ?? "queued")
                ProgressView(value: progress)
            }
            Section("Results") {
                if record?.status == "completed" {
                    Text(String(describing: record?.payload))
                } else {
                    ContentUnavailableView("Results pending", systemImage: "hourglass")
                }
            }
        }
        .uniNavigationTitle("Backtest")
    }

    private var progress: Double { record?.status == "completed" ? 1 : 0.05 }
}

struct QuantAntBacktestCompareView: View {
    let records: [QuantAntRecordDTO]

    var body: some View {
        UniList {
            Section("Compare runs") {
                ForEach(records) { record in QuantAntRecordRow(record: record, icon: "chart.bar.xaxis") }
            }
            if records.isEmpty {
                ContentUnavailableView("No backtests", systemImage: "chart.bar.doc.horizontal")
            }
        }
        .uniNavigationTitle("Backtest comparison")
    }
}


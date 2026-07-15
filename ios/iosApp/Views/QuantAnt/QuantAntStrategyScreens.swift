import SwiftUI

struct QuantAntStrategiesView: View {
    @EnvironmentObject private var navigation: NavigationViewModel
    let store: QuantAntStrategyStore

    var body: some View {
        List {
            Section("Production templates") {
                ForEach(store.templates) { template in
                    Button { navigation.navigate(to: .quantAnt(.strategyEditor(template.key))) } label: {
                        HStack {
                            Image(systemName: icon(template.key))
                                .foregroundStyle(QuantAntTheme.indigo)
                            VStack(alignment: .leading) {
                                Text(template.displayName[language] ?? template.key).font(.headline)
                                Text("Immutable schema v\(template.schemaVersion)")
                                    .font(.caption).foregroundStyle(.secondary)
                            }
                        }
                    }
                    .buttonStyle(.plain)
                }
            }
            Section("Strategies") {
                if store.strategies.isEmpty {
                    Text("No strategy versions yet").foregroundStyle(.secondary)
                } else {
                    ForEach(store.strategies) { strategy in
                        Button { navigation.navigate(to: .quantAnt(.strategy(strategy.id))) } label: {
                            recordRow(strategy, icon: "function")
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            Section {
                Button("Backtest runs") { navigation.navigate(to: .quantAnt(.backtestCompare)) }
                Button("Active deployments") { navigation.navigate(to: .quantAnt(.deployments)) }
            }
        }
        .navigationTitle("Strategies")
    }

    private var language: String { Locale.current.language.languageCode?.identifier == "vi" ? "vi" : "en" }
    private func icon(_ key: String) -> String {
        key == "momentum" ? "waveform.path.ecg" : key == "mean_reversion" ? "arrow.triangle.2.circlepath" : "chart.line.uptrend.xyaxis"
    }
}

struct QuantAntStrategyDetailView: View {
    @EnvironmentObject private var navigation: NavigationViewModel
    let record: QuantAntRecordDTO

    var body: some View {
        Form {
            Section("Strategy") {
                LabeledContent("Name", value: record.name ?? "Strategy")
                LabeledContent("Lifecycle", value: record.status ?? "draft")
                LabeledContent("Version ID", value: record.id)
                LabeledContent("Created", value: record.createdAt.formatted())
            }
            Section("Immutable version") {
                Text("Parameter changes create a new version hash; active deployments keep their original version.")
                    .font(.footnote).foregroundStyle(.secondary)
            }
            Section {
                Button("Clone / edit parameters") { navigation.navigate(to: .quantAnt(.strategyEditor(record.id))) }
                Button("Run backtest") { navigation.navigate(to: .quantAnt(.backtestSetup(record.id))) }
            }
        }
        .navigationTitle(record.name ?? "Strategy")
    }
}

struct QuantAntStrategyEditorView: View {
    @EnvironmentObject private var navigation: NavigationViewModel
    let template: QuantAntStrategyTemplateDTO?
    let sourceID: String?
    @State private var name = ""

    var body: some View {
        Form {
            Section("Version") {
                TextField("Strategy name", text: $name)
                LabeledContent("Template", value: template?.key ?? sourceID ?? "custom")
                LabeledContent("Schema", value: "v\(template?.schemaVersion ?? 1)")
            }
            Section("Parameters") {
                schemaSummary
            }
            Section("Safety") {
                Label("Raw code editing is unavailable on iPhone", systemImage: "iphone.slash")
                Label("A backtest is required before paper deployment", systemImage: "checkmark.shield")
            }
            Section {
                Button("Create immutable version") { navigation.navigate(to: .quantAnt(.backtestSetup(sourceID ?? template?.key ?? "new"))) }
                    .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
            }
        }
        .navigationTitle(sourceID == nil ? "New strategy" : "Clone strategy")
    }

    @ViewBuilder private var schemaSummary: some View {
        if let template {
            Text("Parameters are generated from the \(template.key) JSON Schema.")
                .font(.subheadline)
            Text(String(describing: template.parametersSchema))
                .font(.caption.monospaced())
                .foregroundStyle(.secondary)
                .lineLimit(8)
        } else {
            ContentUnavailableView("Schema unavailable", systemImage: "doc.badge.ellipsis")
        }
    }
}

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
                Picker("Interval", selection: $interval) {
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
                Button("Queue backtest") { navigation.navigate(to: .quantAnt(.backtest("pending"))) }
                    .disabled(Int(seed) == nil || Decimal(string: capital).map { $0 <= 0 } ?? true)
            }
        }
        .navigationTitle("Backtest setup")
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
        .navigationTitle("Backtest")
    }

    private var progress: Double { record?.status == "completed" ? 1 : 0.05 }
}

struct QuantAntBacktestCompareView: View {
    let records: [QuantAntRecordDTO]

    var body: some View {
        List {
            Section("Compare runs") {
                ForEach(records) { record in recordRow(record, icon: "chart.bar.xaxis") }
            }
            if records.isEmpty {
                ContentUnavailableView("No backtests", systemImage: "chart.bar.doc.horizontal")
            }
        }
        .navigationTitle("Backtest comparison")
    }
}

struct QuantAntDeploymentsView: View {
    @EnvironmentObject private var navigation: NavigationViewModel
    let records: [QuantAntRecordDTO]

    var body: some View {
        List(records) { record in
            Button { navigation.navigate(to: .quantAnt(.deployment(record.id))) } label: {
                recordRow(record, icon: "bolt.horizontal.circle")
            }
            .buttonStyle(.plain)
        }
        .overlay {
            if records.isEmpty { ContentUnavailableView("No deployments", systemImage: "bolt.slash") }
        }
        .navigationTitle("Deployments")
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
                QuantAntMetricCard(title: "Signals", value: "—", systemImage: "antenna.radiowaves.left.and.right")
                QuantAntMetricCard(title: "Orders", value: "—", systemImage: "list.bullet")
                QuantAntMetricCard(title: "P&L", value: "—", systemImage: "chart.line.uptrend.xyaxis")
            }
            Section("Controls") {
                Button("Pause") {}.disabled(true)
                Button("Resume") {}.disabled(true)
                Button("Stop", role: .destructive) {}.disabled(true)
                Text("Controls require versioned deployment command endpoints.")
                    .font(.footnote).foregroundStyle(.secondary)
            }
            Section("Version history & rollback") {
                ContentUnavailableView("No prior versions", systemImage: "clock.arrow.circlepath")
            }
        }
        .navigationTitle("Deployment")
    }
}

@ViewBuilder
private func recordRow(_ record: QuantAntRecordDTO, icon: String) -> some View {
    HStack {
        Image(systemName: icon).foregroundStyle(QuantAntTheme.indigo)
        VStack(alignment: .leading) {
            Text(record.name ?? record.id).font(.headline).lineLimit(1)
            Text(record.status ?? "").font(.caption).foregroundStyle(.secondary)
        }
        Spacer()
        Text(record.createdAt, style: .relative).font(.caption2).foregroundStyle(.secondary)
    }
    .accessibilityElement(children: .combine)
}

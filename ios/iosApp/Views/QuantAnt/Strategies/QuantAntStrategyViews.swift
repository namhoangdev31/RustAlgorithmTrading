import ExploreSwiftUI
import SwiftUI

struct QuantAntStrategiesView: View {
    @EnvironmentObject private var navigation: NavigationViewModel
    let store: QuantAntStrategyStore

    var body: some View {
        UniList {
            Section("Production templates") {
                ForEach(store.templates) { template in
                    UniButton { navigation.navigate(to: .quantAnt(.strategyEditor(template.key))) } label: {
                        HStack {
                            Image(systemName: icon(template.key))
                                .uniForegroundStyle(QuantAntTheme.indigo)
                            VStack(alignment: .leading) {
                                Text(template.displayName[language] ?? template.key).font(.headline)
                                Text("Immutable schema v\(template.schemaVersion)")
                                    .font(.caption).uniForegroundStyle(.secondary)
                            }
                        }
                    }
                    .uniButtonStyle(.plain)
                }
            }
            Section("Strategies") {
                if store.strategies.isEmpty {
                    Text("No strategy versions yet").uniForegroundStyle(.secondary)
                } else {
                    ForEach(store.strategies) { strategy in
                        UniButton { navigation.navigate(to: .quantAnt(.strategy(strategy.id))) } label: {
                            QuantAntRecordRow(record: strategy, icon: "function")
                        }
                        .uniButtonStyle(.plain)
                    }
                }
            }
            Section {
                UniButton("Backtest runs") { navigation.navigate(to: .quantAnt(.backtestCompare)) }
                UniButton("Active deployments") { navigation.navigate(to: .quantAnt(.deployments)) }
            }
        }
        .uniNavigationTitle("Strategies")
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
                    .font(.footnote).uniForegroundStyle(.secondary)
            }
            Section {
                UniButton("Clone / edit parameters") { navigation.navigate(to: .quantAnt(.strategyEditor(record.id))) }
                UniButton("Run backtest") { navigation.navigate(to: .quantAnt(.backtestSetup(record.id))) }
            }
        }
        .uniNavigationTitle(record.name ?? "Strategy")
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
                UniButton("Create immutable version") { navigation.navigate(to: .quantAnt(.backtestSetup(sourceID ?? template?.key ?? "new"))) }
                    .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
            }
        }
        .uniNavigationTitle(sourceID == nil ? "New strategy" : "Clone strategy")
    }

    @ViewBuilder private var schemaSummary: some View {
        if let template {
            Text("Parameters are generated from the \(template.key) JSON Schema.")
                .font(.subheadline)
            Text(String(describing: template.parametersSchema))
                .font(.caption.monospaced())
                .uniForegroundStyle(.secondary)
                .lineLimit(8)
        } else {
            ContentUnavailableView("Schema unavailable", systemImage: "doc.badge.ellipsis")
        }
    }
}


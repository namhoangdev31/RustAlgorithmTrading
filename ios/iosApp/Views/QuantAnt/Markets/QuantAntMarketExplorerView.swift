import ExploreSwiftUI
import SwiftUI

struct QuantAntMarketExplorerView: View {
    @EnvironmentObject private var navigation: NavigationViewModel
    let store: QuantAntMarketStore

    var body: some View {
        QuantAntStateView(state: store.state, retry: store.load) {
            UniList {
                assetClassPicker
                ForEach(store.visibleInstruments) { instrument in
                    UniButton { navigation.navigate(to: .quantAnt(.instrument(instrument.id))) } label: {
                        instrumentRow(instrument)
                    }
                    .uniButtonStyle(.plain)
                }
            }
            .uniListStyle(.plain)
            .searchable(text: Binding(get: { store.searchText }, set: { store.searchText = $0 }))
        }
        .uniNavigationTitle("Markets")
        .task { if store.state == .idle { await store.load() } }
    }

    private var assetClassPicker: some View {
        UniPicker("Asset class", selection: Binding(get: { store.assetClass }, set: { store.assetClass = $0 })) {
            Text("All").tag("all")
            Text("Stocks").tag("equity")
            Text("Crypto").tag("crypto")
            Text("Forex").tag("forex")
            Text("Indices").tag("index")
            Text("Futures").tag("commodity_future")
        }
        .uniPickerStyle(.menu)
    }

    private func instrumentRow(_ instrument: QuantAntInstrumentDTO) -> some View {
        HStack(spacing: 12) {
            Image(systemName: symbol(for: instrument.assetClass))
                .frame(width: 38, height: 38)
                .uniForegroundStyle(QuantAntTheme.indigo)
                .background(QuantAntTheme.indigo.opacity(0.1), in: Circle())
            VStack(alignment: .leading) {
                Text(instrument.canonicalSymbol).font(.headline)
                Text(instrument.displayName).font(.caption).uniForegroundStyle(.secondary).lineLimit(1)
            }
            Spacer()
            QuantAntStatusBadge(
                title: instrument.executionLevel.rawValue.replacingOccurrences(of: "_", with: " "),
                color: instrument.canPaperTrade ? QuantAntTheme.teal : .secondary
            )
        }
        .contentShape(Rectangle())
        .accessibilityElement(children: .combine)
    }

    private func symbol(for assetClass: String) -> String {
        switch assetClass {
        case "crypto": "bitcoinsign.circle"
        case "forex": "dollarsign.arrow.circlepath"
        case "index": "chart.line.uptrend.xyaxis"
        case "commodity_future": "shippingbox"
        default: "building.columns"
        }
    }
}


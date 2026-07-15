import Charts
import SwiftUI

struct QuantAntMarketExplorerView: View {
    @EnvironmentObject private var navigation: NavigationViewModel
    let store: QuantAntMarketStore

    var body: some View {
        QuantAntStateView(state: store.state, retry: store.load) {
            List {
                assetClassPicker
                ForEach(store.visibleInstruments) { instrument in
                    Button { navigation.navigate(to: .quantAnt(.instrument(instrument.id))) } label: {
                        instrumentRow(instrument)
                    }
                    .buttonStyle(.plain)
                }
            }
            .listStyle(.plain)
            .searchable(text: Binding(get: { store.searchText }, set: { store.searchText = $0 }))
        }
        .navigationTitle("Markets")
        .task { if store.state == .idle { await store.load() } }
    }

    private var assetClassPicker: some View {
        Picker("Asset class", selection: Binding(get: { store.assetClass }, set: { store.assetClass = $0 })) {
            Text("All").tag("all")
            Text("Stocks").tag("equity")
            Text("Crypto").tag("crypto")
            Text("Forex").tag("forex")
            Text("Indices").tag("index")
            Text("Futures").tag("commodity_future")
        }
        .pickerStyle(.menu)
    }

    private func instrumentRow(_ instrument: QuantAntInstrumentDTO) -> some View {
        HStack(spacing: 12) {
            Image(systemName: symbol(for: instrument.assetClass))
                .frame(width: 38, height: 38)
                .foregroundStyle(QuantAntTheme.indigo)
                .background(QuantAntTheme.indigo.opacity(0.1), in: Circle())
            VStack(alignment: .leading) {
                Text(instrument.canonicalSymbol).font(.headline)
                Text(instrument.displayName).font(.caption).foregroundStyle(.secondary).lineLimit(1)
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

struct QuantAntInstrumentDetailView: View {
    @EnvironmentObject private var navigation: NavigationViewModel
    let instrument: QuantAntInstrumentDTO
    let store: QuantAntMarketStore

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                HStack {
                    VStack(alignment: .leading) {
                        Text(instrument.canonicalSymbol).font(.largeTitle.bold())
                        Text(instrument.displayName).foregroundStyle(.secondary)
                    }
                    Spacer()
                    QuantAntStatusBadge(title: instrument.marketDataLevel.rawValue, color: QuantAntTheme.teal)
                }
                QuantAntStateView(state: store.candleState, retry: loadCandles) {
                    candleChart
                }
                capabilityGrid
                HStack {
                    Button("Buy") { navigation.navigate(to: .quantAnt(.orderTicket(instrument.id))) }
                        .buttonStyle(.borderedProminent).tint(QuantAntTheme.positive)
                    Button("Sell") { navigation.navigate(to: .quantAnt(.orderTicket(instrument.id))) }
                        .buttonStyle(.borderedProminent).tint(QuantAntTheme.negative)
                }
                .disabled(!instrument.canPaperTrade || store.candleState != .loaded)
                unsupportedDepth
            }
            .padding()
        }
        .navigationTitle(instrument.canonicalSymbol)
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadCandles() }
    }

    private var candleChart: some View {
        Chart(store.candles) { candle in
            LineMark(x: .value("Time", candle.timestamp), y: .value("Close", candle.closeValue))
                .foregroundStyle(QuantAntTheme.indigo)
            AreaMark(x: .value("Time", candle.timestamp), y: .value("Close", candle.closeValue))
                .foregroundStyle(QuantAntTheme.indigo.opacity(0.1))
        }
        .frame(height: 260)
        .chartYAxis { AxisMarks(position: .trailing) }
        .accessibilityLabel("Price chart for \(instrument.canonicalSymbol)")
    }

    private var capabilityGrid: some View {
        Grid(alignment: .leading, horizontalSpacing: 24, verticalSpacing: 10) {
            GridRow { Text("Asset class").foregroundStyle(.secondary); Text(instrument.assetClass) }
            GridRow { Text("Provider").foregroundStyle(.secondary); Text(instrument.provider) }
            GridRow { Text("Exchange").foregroundStyle(.secondary); Text(instrument.exchange ?? "—") }
            GridRow { Text("Timezone").foregroundStyle(.secondary); Text(instrument.timezone) }
        }
        .font(.subheadline)
    }

    private var unsupportedDepth: some View {
        ContentUnavailableView(
            "Depth & trades",
            systemImage: "book.pages",
            description: Text("Shown when the selected provider exposes order-book depth.")
        )
        .frame(minHeight: 180)
    }

    private func loadCandles() async { await store.loadCandles(instrumentID: instrument.id) }
}

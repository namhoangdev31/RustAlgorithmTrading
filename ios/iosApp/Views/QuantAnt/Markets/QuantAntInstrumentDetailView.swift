import Charts
import ExploreSwiftUI
import SwiftUI

struct QuantAntInstrumentDetailView: View {
    @EnvironmentObject private var navigation: NavigationViewModel
    let instrument: QuantAntInstrumentDTO
    let store: QuantAntMarketStore

    var body: some View {
        UniScrollView {
            VStack(alignment: .leading, spacing: 18) {
                HStack {
                    VStack(alignment: .leading) {
                        Text(instrument.canonicalSymbol).font(.largeTitle.bold())
                        Text(instrument.displayName).uniForegroundStyle(.secondary)
                    }
                    Spacer()
                    QuantAntStatusBadge(title: instrument.marketDataLevel.rawValue, color: QuantAntTheme.teal)
                }
                QuantAntStateView(state: store.candleState, retry: loadCandles) {
                    candleChart
                }
                capabilityGrid
                HStack {
                    UniButton("Buy") { navigation.navigate(to: .quantAnt(.orderTicket(instrument.id))) }
                        .uniButtonStyle(.borderedProminent).tint(QuantAntTheme.positive)
                    UniButton("Sell") { navigation.navigate(to: .quantAnt(.orderTicket(instrument.id))) }
                        .uniButtonStyle(.borderedProminent).tint(QuantAntTheme.negative)
                }
                .disabled(!instrument.canPaperTrade || store.candleState != .loaded)
                unsupportedDepth
            }
            .padding()
        }
        .uniNavigationTitle(instrument.canonicalSymbol)
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
            GridRow { Text("Asset class").uniForegroundStyle(.secondary); Text(instrument.assetClass) }
            GridRow { Text("Provider").uniForegroundStyle(.secondary); Text(instrument.provider) }
            GridRow { Text("Exchange").uniForegroundStyle(.secondary); Text(instrument.exchange ?? "—") }
            GridRow { Text("Timezone").uniForegroundStyle(.secondary); Text(instrument.timezone) }
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


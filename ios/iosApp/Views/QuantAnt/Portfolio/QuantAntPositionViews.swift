import ExploreSwiftUI
import SwiftUI

struct QuantAntPositionsView: View {
    @EnvironmentObject private var navigation: NavigationViewModel
    let store: QuantAntPortfolioStore

    var body: some View {
        QuantAntStateView(state: store.state, retry: nil) {
            UniList(store.positions) { position in
                UniButton { navigation.navigate(to: .quantAnt(.position(position.id))) } label: {
                    HStack {
                        VStack(alignment: .leading) {
                            Text(position.symbol).font(.headline)
                            Text("Avg \(position.averagePrice)").font(.caption).uniForegroundStyle(.secondary)
                        }
                        Spacer()
                        VStack(alignment: .trailing) {
                            Text(position.quantity)
                            Text(position.realizedPnL).font(.caption).uniForegroundStyle(.secondary)
                        }
                    }
                }
                .uniButtonStyle(.plain)
            }
        }
        .uniNavigationTitle("Positions")
    }
}

struct QuantAntPositionDetailView: View {
    let position: QuantAntPositionDTO
    let store: QuantAntPortfolioStore
    @State private var quantity = ""
    @State private var confirmFullClose = false

    var body: some View {
        Form {
            Section("Position") {
                LabeledContent("Symbol", value: position.symbol)
                LabeledContent("Quantity", value: position.quantity)
                LabeledContent("Average price", value: position.averagePrice)
                LabeledContent("Realized P&L", value: position.realizedPnL)
                LabeledContent("Reconciled", value: position.reconciledAt.formatted())
            }
            Section("Risk controls") {
                ContentUnavailableView(
                    "Modify TP/SL",
                    systemImage: "slider.horizontal.3",
                    description: Text("Requires broker bracket-order capability.")
                )
            }
            Section("Reduce exposure") {
                TextField("Partial quantity", text: $quantity).keyboardType(.decimalPad)
                UniButton("Partial close") { Task { try? await store.close(position: position, quantity: quantity) } }
                    .disabled(Decimal(string: quantity).map { $0 <= 0 } ?? true)
                UniButton("Close full position", role: .destructive) { confirmFullClose = true }
            }
        }
        .uniNavigationTitle(position.symbol)
        .confirmationDialog("Close the entire position?", isPresented: $confirmFullClose) {
            UniButton("Close position", role: .destructive) { Task { try? await store.close(position: position) } }
        }
    }
}


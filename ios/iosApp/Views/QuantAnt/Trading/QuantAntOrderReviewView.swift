import ExploreSwiftUI
import SwiftUI

struct QuantAntOrderReviewView: View {
    @EnvironmentObject private var navigation: NavigationViewModel
    let request: QuantAntCreateOrderRequest
    let store: QuantAntTradingStore

    var body: some View {
        Form {
            Section("Order summary") {
                LabeledContent("Side", value: request.side.capitalized)
                LabeledContent("Type", value: request.orderType.replacingOccurrences(of: "_", with: " ").capitalized)
                LabeledContent("Quantity", value: request.quantity)
                LabeledContent("Mode", value: request.mode.rawValue.uppercased())
                if let value = request.limitPrice { LabeledContent("Limit", value: value) }
                if let value = request.stopPrice { LabeledContent("Stop", value: value) }
            }
            Section("Final checks") {
                Label("Pre-trade risk is mandatory", systemImage: "shield.checkered")
                Label("Idempotency key is generated on submit", systemImage: "checkmark.seal")
                Label("Live requires a five-minute device session", systemImage: "faceid")
            }
            Section {
                if request.mode == .live {
                    UniButton("Unlock live session") { navigation.navigate(to: .quantAnt(.liveUnlock)) }
                } else {
                    UniButton("Submit paper order") { Task { await store.submit(request) } }
                        .disabled(store.state == .loading)
                }
            }
            if let order = store.lastOrder {
                Section("Result") {
                    Label(order.status.capitalized, systemImage: "checkmark.circle.fill")
                        .uniForegroundStyle(QuantAntTheme.positive)
                    LabeledContent("Client order ID", value: order.clientOrderID)
                }
            }
            if case .error(let message, _) = store.state {
                Section { Text(message).uniForegroundStyle(.red) }
            }
        }
        .uniNavigationTitle("Review order")
    }
}


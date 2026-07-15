import ExploreSwiftUI
import SwiftUI

struct QuantAntOrderTicketView: View {
    @EnvironmentObject private var navigation: NavigationViewModel
    let root: QuantAntStore
    let initialInstrumentID: String?
    @State private var instrumentID = ""
    @State private var side = "buy"
    @State private var orderType = "market"
    @State private var timeInForce = "day"
    @State private var quantity = ""
    @State private var limitPrice = ""
    @State private var stopPrice = ""
    @State private var takeProfit = ""
    @State private var stopLoss = ""
    @State private var trailValue = ""

    var body: some View {
        Form {
            Section("Instrument") {
                UniPicker("Symbol", selection: $instrumentID) {
                    Text("Select").tag("")
                    ForEach(root.markets.instruments) { Text($0.canonicalSymbol).tag($0.id) }
                }
                UniPicker("Side", selection: $side) {
                    Text("Buy").tag("buy")
                    Text("Sell").tag("sell")
                }
                .uniPickerStyle(.segmented)
            }
            Section("Order") {
                UniPicker("Type", selection: $orderType) {
                    ForEach(availableOrderTypes, id: \.self) { Text(label($0)).tag($0) }
                }
                UniPicker("Time in force", selection: $timeInForce) {
                    Text("Day").tag("day")
                    Text("GTC").tag("gtc")
                    Text("IOC").tag("ioc")
                    Text("FOK").tag("fok")
                }
                TextField("Quantity", text: $quantity).keyboardType(.decimalPad)
                if ["limit", "stop_limit", "bracket"].contains(orderType) {
                    TextField("Limit price", text: $limitPrice).keyboardType(.decimalPad)
                }
                if ["stop", "stop_limit"].contains(orderType) {
                    TextField("Stop price", text: $stopPrice).keyboardType(.decimalPad)
                }
                if orderType == "bracket" {
                    TextField("Take-profit price", text: $takeProfit).keyboardType(.decimalPad)
                    TextField("Stop-loss price", text: $stopLoss).keyboardType(.decimalPad)
                }
                if orderType == "trailing_stop" {
                    TextField("Trail value", text: $trailValue).keyboardType(.decimalPad)
                }
            }
            Section("Risk controls") {
                LabeledContent("Mode", value: root.mode.rawValue.capitalized)
                LabeledContent("Market freshness", value: root.markets.state == .loaded ? "Fresh" : "Unavailable")
                Text("Orders are never queued offline. Risk and capability checks run again in the execution engine.")
                    .font(.footnote).uniForegroundStyle(.secondary)
            }
            Section {
                UniButton("Review order") { navigation.navigate(to: .quantAnt(.orderReview(request))) }
                    .disabled(!isValid)
            }
        }
        .uniNavigationTitle("Order ticket")
        .onAppear { if instrumentID.isEmpty { instrumentID = initialInstrumentID ?? "" } }
    }

    private var selectedInstrument: QuantAntInstrumentDTO? {
        root.markets.instruments.first { $0.id == instrumentID }
    }

    private var availableOrderTypes: [String] {
        guard let selectedInstrument,
              case .object(let object) = selectedInstrument.capabilities,
              case .array(let values)? = object["order_types"] else { return ["market", "limit"] }
        return values.compactMap { if case .string(let value) = $0 { value } else { nil } }
    }

    private var isValid: Bool {
        guard !instrumentID.isEmpty, Decimal(string: quantity).map({ $0 > 0 }) == true,
              root.markets.state == .loaded else { return false }
        if root.mode == .live { return root.bootstrap?.liveEnabled == true }
        return selectedInstrument?.canPaperTrade == true
    }

    private var request: QuantAntCreateOrderRequest {
        QuantAntCreateOrderRequest(
            accountID: root.selectedAccountID ?? "", instrumentID: instrumentID, mode: root.mode,
            side: side, orderType: orderType, timeInForce: timeInForce, quantity: quantity,
            limitPrice: limitPrice.nilIfEmpty, stopPrice: stopPrice.nilIfEmpty,
            takeProfitPrice: takeProfit.nilIfEmpty, stopLossPrice: stopLoss.nilIfEmpty,
            trailValue: trailValue.nilIfEmpty, strategyVersionHash: nil
        )
    }

    private func label(_ value: String) -> String {
        value.replacingOccurrences(of: "_", with: " ").capitalized
    }
}

private extension String {
    var nilIfEmpty: String? { isEmpty ? nil : self }
}


import ExploreSwiftUI
import SwiftUI

struct QuantAntOrdersView: View {
    @EnvironmentObject private var navigation: NavigationViewModel
    let store: QuantAntPortfolioStore
    @State private var selection = 0

    var body: some View {
        VStack {
            UniPicker("Order status", selection: $selection) {
                Text("Open").tag(0)
                Text("History").tag(1)
            }
            .uniPickerStyle(.segmented)
            .padding(.horizontal)
            QuantAntStateView(state: store.state, retry: nil) {
                UniList(selection == 0 ? store.openOrders : store.historyOrders) { order in
                    UniButton { navigation.navigate(to: .quantAnt(.order(order.id))) } label: {
                        orderRow(order)
                    }
                    .uniButtonStyle(.plain)
                }
                .uniListStyle(.plain)
            }
        }
        .uniNavigationTitle("Orders")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                UniButton("Positions") { navigation.navigate(to: .quantAnt(.positions)) }
            }
        }
    }

    private func orderRow(_ order: QuantAntOrderDTO) -> some View {
        HStack {
            VStack(alignment: .leading) {
                Text(order.symbol).font(.headline)
                Text("\(order.side.uppercased()) · \(order.orderType)").font(.caption).uniForegroundStyle(.secondary)
            }
            Spacer()
            VStack(alignment: .trailing) {
                Text(order.quantity)
                QuantAntStatusBadge(title: order.status, color: statusColor(order.status))
            }
        }
        .accessibilityElement(children: .combine)
    }

    private func statusColor(_ status: String) -> Color {
        if status == "filled" { return QuantAntTheme.positive }
        if status == "rejected" || status == "cancelled" { return QuantAntTheme.negative }
        return .orange
    }
}

struct QuantAntOrderDetailView: View {
    let order: QuantAntOrderDTO
    let store: QuantAntPortfolioStore
    @State private var cancelling = false

    var body: some View {
        Form {
            Section("Order") {
                LabeledContent("Symbol", value: order.symbol)
                LabeledContent("Side", value: order.side.uppercased())
                LabeledContent("Type", value: order.orderType)
                LabeledContent("Quantity", value: order.quantity)
                LabeledContent("Status", value: order.status)
                LabeledContent("Mode", value: order.mode.rawValue.uppercased())
                LabeledContent("Client ID", value: order.clientOrderID)
                if let id = order.brokerOrderID { LabeledContent("Broker ID", value: id) }
            }
            if ["pending", "accepted", "partially_filled"].contains(order.status) {
                Section {
                    UniButton("Cancel order", role: .destructive) { cancelling = true }
                }
            }
        }
        .uniNavigationTitle(order.symbol)
        .confirmationDialog("Cancel this order?", isPresented: $cancelling) {
            UniButton("Cancel order", role: .destructive) { Task { try? await store.cancel(order: order) } }
        }
    }
}


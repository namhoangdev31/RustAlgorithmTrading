import SwiftUI

struct QuantAntPortfolioSummaryView: View {
    let store: QuantAntPortfolioStore

    var body: some View {
        QuantAntStateView(state: store.state, retry: nil) {
            if let portfolio = store.portfolio {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Account equity").font(.caption).foregroundStyle(.secondary)
                    Text(portfolio.equity.quantAntCurrency(portfolio.currency))
                        .font(.system(.largeTitle, design: .rounded, weight: .bold))
                        .minimumScaleFactor(0.7)
                    HStack {
                        Label(portfolio.unrealizedPnL.quantAntCurrency(portfolio.currency), systemImage: "chart.line.uptrend.xyaxis")
                        Spacer()
                        Text("Buying power \(portfolio.buyingPower.quantAntCurrency(portfolio.currency))")
                    }
                    .font(.footnote)
                }
                .padding()
                .foregroundStyle(.white)
                .background(
                    LinearGradient(colors: [QuantAntTheme.indigo, QuantAntTheme.teal], startPoint: .topLeading, endPoint: .bottomTrailing),
                    in: RoundedRectangle(cornerRadius: 20)
                )
                .accessibilityElement(children: .combine)
            }
        }
    }
}

struct QuantAntPortfolioView: View {
    let store: QuantAntPortfolioStore

    var body: some View {
        ScrollView {
            QuantAntStateView(state: store.state, retry: nil) {
                if let portfolio = store.portfolio {
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                        QuantAntMetricCard(title: "Equity", value: portfolio.equity.quantAntCurrency(portfolio.currency), systemImage: "chart.pie")
                        QuantAntMetricCard(title: "Cash", value: portfolio.cash.quantAntCurrency(portfolio.currency), systemImage: "banknote")
                        QuantAntMetricCard(title: "Buying power", value: portfolio.buyingPower.quantAntCurrency(portfolio.currency), systemImage: "bolt")
                        QuantAntMetricCard(title: "Margin used", value: portfolio.marginUsed.quantAntCurrency(portfolio.currency), systemImage: "gauge.with.dots.needle.33percent")
                        QuantAntMetricCard(title: "Realized P&L", value: portfolio.realizedPnL.quantAntCurrency(portfolio.currency), systemImage: "checkmark.circle", tint: QuantAntTheme.teal)
                        QuantAntMetricCard(title: "Unrealized P&L", value: portfolio.unrealizedPnL.quantAntCurrency(portfolio.currency), systemImage: "waveform.path.ecg", tint: .orange)
                    }
                    ContentUnavailableView(
                        "Equity curve & allocation",
                        systemImage: "chart.xyaxis.line",
                        description: Text("Available when portfolio snapshot history is enabled.")
                    )
                    .frame(minHeight: 220)
                }
            }
            .padding()
        }
        .navigationTitle("Portfolio")
    }
}

struct QuantAntOrdersView: View {
    @EnvironmentObject private var navigation: NavigationViewModel
    let store: QuantAntPortfolioStore
    @State private var selection = 0

    var body: some View {
        VStack {
            Picker("Order status", selection: $selection) {
                Text("Open").tag(0)
                Text("History").tag(1)
            }
            .pickerStyle(.segmented)
            .padding(.horizontal)
            QuantAntStateView(state: store.state, retry: nil) {
                List(selection == 0 ? store.openOrders : store.historyOrders) { order in
                    Button { navigation.navigate(to: .quantAnt(.order(order.id))) } label: {
                        orderRow(order)
                    }
                    .buttonStyle(.plain)
                }
                .listStyle(.plain)
            }
        }
        .navigationTitle("Orders")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("Positions") { navigation.navigate(to: .quantAnt(.positions)) }
            }
        }
    }

    private func orderRow(_ order: QuantAntOrderDTO) -> some View {
        HStack {
            VStack(alignment: .leading) {
                Text(order.symbol).font(.headline)
                Text("\(order.side.uppercased()) · \(order.orderType)").font(.caption).foregroundStyle(.secondary)
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
                    Button("Cancel order", role: .destructive) { cancelling = true }
                }
            }
        }
        .navigationTitle(order.symbol)
        .confirmationDialog("Cancel this order?", isPresented: $cancelling) {
            Button("Cancel order", role: .destructive) { Task { try? await store.cancel(order: order) } }
        }
    }
}

struct QuantAntPositionsView: View {
    @EnvironmentObject private var navigation: NavigationViewModel
    let store: QuantAntPortfolioStore

    var body: some View {
        QuantAntStateView(state: store.state, retry: nil) {
            List(store.positions) { position in
                Button { navigation.navigate(to: .quantAnt(.position(position.id))) } label: {
                    HStack {
                        VStack(alignment: .leading) {
                            Text(position.symbol).font(.headline)
                            Text("Avg \(position.averagePrice)").font(.caption).foregroundStyle(.secondary)
                        }
                        Spacer()
                        VStack(alignment: .trailing) {
                            Text(position.quantity)
                            Text(position.realizedPnL).font(.caption).foregroundStyle(.secondary)
                        }
                    }
                }
                .buttonStyle(.plain)
            }
        }
        .navigationTitle("Positions")
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
                Button("Partial close") { Task { try? await store.close(position: position, quantity: quantity) } }
                    .disabled(Decimal(string: quantity).map { $0 <= 0 } ?? true)
                Button("Close full position", role: .destructive) { confirmFullClose = true }
            }
        }
        .navigationTitle(position.symbol)
        .confirmationDialog("Close the entire position?", isPresented: $confirmFullClose) {
            Button("Close position", role: .destructive) { Task { try? await store.close(position: position) } }
        }
    }
}

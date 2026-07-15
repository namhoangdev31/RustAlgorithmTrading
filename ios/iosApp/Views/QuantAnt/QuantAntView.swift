import ExploreSwiftUI
import SwiftUI

struct QuantAntView: View {
    @EnvironmentObject private var navigation: NavigationViewModel
    @State private var store: QuantAntStore

    init(store: QuantAntStore) { _store = State(initialValue: store) }

    var body: some View {
        QuantAntStateView(state: store.state, retry: store.load) {
            UniList {
                accountSection

                Section("Quick actions") {
                    navigationRow("Markets", "chart.xyaxis.line", .marketExplorer)
                    navigationRow("Trade", "arrow.left.arrow.right", .orderTicket(nil))
                    navigationRow("Risk", "shield.lefthalf.filled", .riskCenter)
                    navigationRow("Alerts", "bell.badge", .alerts)
                }

                Section("Desk operations") {
                    navigationRow("Orders & positions", "list.bullet.rectangle", .orders)
                    navigationRow("Strategies & backtests", "function", .strategies)
                    navigationRow("Deployments", "bolt.horizontal.circle", .deployments)
                    navigationRow("Intelligence", "newspaper", .intelligence)
                    navigationRow("System health", "waveform.path.ecg", .systemHealth)
                    navigationRow("Audit log", "checkmark.seal", .auditLog)
                }
            }
        }
        .task { if store.state == .idle { await store.load() } }
        .refreshable { await store.load() }
        .uniNavigationTitle("QuantAnt")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                UniMenu {
                    UniButton("Paper") { Task { await store.setMode(.paper) } }
                    UniButton("Live") { navigation.navigate(to: .quantAnt(.liveUnlock)) }
                        .disabled(store.bootstrap?.liveEnabled != true)
                } label: {
                    QuantAntStatusBadge(
                        title: store.mode.rawValue,
                        color: store.mode == .paper ? QuantAntTheme.teal : .red
                    )
                }
            }
        }
    }

    @ViewBuilder private var accountSection: some View {
        if let accounts = store.bootstrap?.accounts, !accounts.isEmpty {
            Section("Account") {
                UniPicker("Broker account", selection: accountBinding(accounts: accounts)) {
                    ForEach(accounts) { Text("\($0.displayName) · \($0.provider)").tag($0.id) }
                }
                .uniPickerStyle(.menu)

                QuantAntStateView(state: store.portfolio.state, retry: nil) {
                    if let portfolio = store.portfolio.portfolio {
                        LabeledContent("Equity", value: portfolio.equity.quantAntCurrency(portfolio.currency))
                        LabeledContent("Buying power", value: portfolio.buyingPower.quantAntCurrency(portfolio.currency))
                        LabeledContent("Unrealized P&L", value: portfolio.unrealizedPnL.quantAntCurrency(portfolio.currency))
                    }
                }
            }
        } else {
            Section {
                ContentUnavailableView(
                    "No desk account",
                    systemImage: "person.crop.circle.badge.exclamationmark",
                    description: Text("An operator grant is required before account data can load.")
                )
            }
        }
    }

    private func navigationRow(_ title: String, _ icon: String, _ route: QuantAntRoute) -> some View {
        QuantAntNavigationRow(title: title, systemImage: icon) {
            navigation.navigate(to: .quantAnt(route))
        }
    }

    private func accountBinding(accounts: [QuantAntAccountSummaryDTO]) -> Binding<String> {
        Binding(
            get: { store.selectedAccountID ?? accounts[0].id },
            set: { id in Task { await store.selectAccount(id) } }
        )
    }
}

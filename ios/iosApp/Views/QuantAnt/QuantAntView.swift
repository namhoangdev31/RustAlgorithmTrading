import SwiftUI

struct QuantAntView: View {
    @EnvironmentObject private var navigation: NavigationViewModel
    @State private var store: QuantAntStore

    init(store: QuantAntStore) { _store = State(initialValue: store) }

    var body: some View {
        ScrollView {
            QuantAntStateView(state: store.state, retry: store.load) {
                LazyVStack(alignment: .leading, spacing: 18) {
                    header
                    accountSummary
                    quickActions
                    deskSurfaces
                }
                .padding()
            }
        }
        .background(Color(.systemGroupedBackground))
        .task { if store.state == .idle { await store.load() } }
        .refreshable { await store.load() }
        .navigationTitle("QuantAnt")
    }

    private var header: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 4) {
                Text("QuantAnt")
                    .font(.largeTitle.bold())
                Text("Internal trading desk")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            Menu {
                Button("Paper") { Task { await store.setMode(.paper) } }
                Button("Live") { navigation.navigate(to: .quantAnt(.liveUnlock)) }
                    .disabled(store.bootstrap?.liveEnabled != true)
            } label: {
                QuantAntStatusBadge(
                    title: store.mode.rawValue,
                    color: store.mode == .paper ? QuantAntTheme.teal : .red
                )
            }
        }
    }

    @ViewBuilder private var accountSummary: some View {
        if let accounts = store.bootstrap?.accounts, !accounts.isEmpty {
            Picker("Broker account", selection: accountBinding(accounts: accounts)) {
                ForEach(accounts) { Text("\($0.displayName) · \($0.provider)").tag($0.id) }
            }
            .pickerStyle(.menu)
            QuantAntPortfolioSummaryView(store: store.portfolio)
        } else {
            ContentUnavailableView(
                "No desk account",
                systemImage: "person.crop.circle.badge.exclamationmark",
                description: Text("An operator grant is required before account data can load.")
            )
        }
    }

    private var quickActions: some View {
        HStack(spacing: 10) {
            action("Markets", "chart.xyaxis.line", .marketExplorer)
            action("Trade", "arrow.left.arrow.right", .orderTicket(nil))
            action("Risk", "shield.lefthalf.filled", .riskCenter)
            action("Alerts", "bell.badge", .alerts)
        }
    }

    private var deskSurfaces: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Desk operations").font(.headline)
            routeRow("Orders & positions", "list.bullet.rectangle", .orders)
            routeRow("Strategies & backtests", "function", .strategies)
            routeRow("Deployments", "bolt.horizontal.circle", .deployments)
            routeRow("Intelligence", "newspaper", .intelligence)
            routeRow("System health", "waveform.path.ecg", .systemHealth)
            routeRow("Audit log", "checkmark.seal", .auditLog)
        }
    }

    private func action(_ title: String, _ icon: String, _ route: QuantAntRoute) -> some View {
        Button { navigation.navigate(to: .quantAnt(route)) } label: {
            VStack(spacing: 7) {
                Image(systemName: icon).font(.title3)
                Text(title).font(.caption.weight(.semibold)).lineLimit(1)
            }
            .frame(maxWidth: .infinity, minHeight: 68)
            .background(.background, in: RoundedRectangle(cornerRadius: 14))
        }
        .buttonStyle(.plain)
    }

    private func routeRow(_ title: String, _ icon: String, _ route: QuantAntRoute) -> some View {
        Button { navigation.navigate(to: .quantAnt(route)) } label: {
            Label(title, systemImage: icon)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding()
                .background(.background, in: RoundedRectangle(cornerRadius: 14))
        }
        .buttonStyle(.plain)
    }

    private func accountBinding(accounts: [QuantAntAccountSummaryDTO]) -> Binding<String> {
        Binding(
            get: { store.selectedAccountID ?? accounts[0].id },
            set: { id in Task { await store.selectAccount(id) } }
        )
    }
}

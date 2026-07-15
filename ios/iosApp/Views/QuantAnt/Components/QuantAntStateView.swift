import SwiftUI

enum QuantAntTheme {
    static let indigo = Color(red: 0.25, green: 0.22, blue: 0.72)
    static let teal = Color(red: 0.04, green: 0.64, blue: 0.58)
    static let positive = Color.green
    static let negative = Color.red
}

struct QuantAntStateView<Content: View>: View {
    let state: QuantAntViewState
    let retry: (() async -> Void)?
    private let content: Content

    init(
        state: QuantAntViewState,
        retry: (() async -> Void)? = nil,
        @ViewBuilder content: () -> Content
    ) {
        self.state = state
        self.retry = retry
        self.content = content()
    }

    var body: some View {
        switch state {
        case .idle:
            content
        case .loading:
            ProgressView("Loading…")
                .frame(maxWidth: .infinity, minHeight: 220)
        case .empty:
            ContentUnavailableView("No data", systemImage: "tray", description: Text("No records match this view."))
        case .unauthorized:
            ContentUnavailableView("Sign in required", systemImage: "lock.fill", description: Text("Your secure session has expired."))
        case .unsupported(let capability):
            ContentUnavailableView(
                "Capability unavailable",
                systemImage: "exclamationmark.shield",
                description: Text(capability)
            )
        case .error(let message, let retryable):
            ContentUnavailableView {
                Label("Unable to load", systemImage: "exclamationmark.triangle")
            } description: {
                Text(message)
            } actions: {
                if retryable, let retry {
                    Button("Retry") { Task { await retry() } }
                }
            }
        case .stale:
            VStack(spacing: 8) {
                statusBanner("Cached data may be stale", icon: "clock.badge.exclamationmark")
                content
            }
        case .offline:
            VStack(spacing: 8) {
                statusBanner("Offline · read-only cache", icon: "wifi.slash")
                content
            }
        case .loaded:
            content
        }
    }

    private func statusBanner(_ title: String, icon: String) -> some View {
        Label(title, systemImage: icon)
            .font(.footnote.weight(.semibold))
            .foregroundStyle(.orange)
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(.orange.opacity(0.12), in: RoundedRectangle(cornerRadius: 10))
            .accessibilityAddTraits(.isStaticText)
    }
}

struct QuantAntStatusBadge: View {
    let title: String
    let color: Color

    var body: some View {
        Text(title.uppercased())
            .font(.caption2.weight(.bold))
            .padding(.horizontal, 9)
            .padding(.vertical, 5)
            .foregroundStyle(color)
            .background(color.opacity(0.13), in: Capsule())
            .accessibilityLabel(title)
    }
}

struct QuantAntMetricCard: View {
    let title: String
    let value: String
    let systemImage: String
    var tint = QuantAntTheme.indigo

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label(title, systemImage: systemImage)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.title3.weight(.bold))
                .contentTransition(.numericText())
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(.background.secondary, in: RoundedRectangle(cornerRadius: 16))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(tint.opacity(0.18)))
        .accessibilityElement(children: .combine)
    }
}

extension String {
    func quantAntCurrency(_ currency: String = "USD") -> String {
        guard let value = Decimal(string: self) else { return self }
        return value.formatted(.currency(code: currency))
    }
}

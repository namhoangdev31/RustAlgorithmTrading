import ExploreSwiftUI
import SwiftUI

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
                    UniButton("Retry") { Task { await retry() } }
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
            .uniForegroundStyle(.orange)
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(.orange.opacity(0.12), in: RoundedRectangle(cornerRadius: 10))
            .accessibilityAddTraits(.isStaticText)
    }
}


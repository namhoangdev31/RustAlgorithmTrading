import ExploreSwiftUI
import SwiftUI

struct RuntimeErrorBoundaryView: View {
    let error: RuntimeShellError
    let onAction: (RuntimeShellAction) -> Void

    var body: some View {
        VStack(spacing: 18) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 52))
                .uniForegroundStyle(.red)

            Text(error.title)
                .font(.title2.weight(.semibold))
                .uniForegroundStyle(.white)

            Text(error.message)
                .font(.body)
                .uniForegroundStyle(.white, opacity: 0.82)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)

            HStack(spacing: 12) {
                ForEach(error.actions, id: \.rawValue) { action in
                    Button(action: { onAction(action) }) {
                        Text(label(for: action))
                            .font(.subheadline.weight(.semibold))
                            .padding(.horizontal, 14)
                            .padding(.vertical, 10)
                    }
                    .buttonStyle(.borderedProminent)
                }
            }
        }
        .padding(24)
        .background(Color.black)
    }

    private func label(for action: RuntimeShellAction) -> String {
        switch action {
        case .retry: return "Retry"
        case .rollback: return "Rollback"
        case .clearData: return "Clear Data"
        case .report: return "Report"
        case .close: return "Close"
        }
    }
}

#if DEBUG
struct RuntimeDiagnosticsView: View {
    let snapshot: RuntimeDiagnosticsSnapshot

    var body: some View {
        NavigationView {
            List {
                Section("Runtime") {
                    row("Generated", snapshot.generatedAt.formatted())
                    row("Active Tab", snapshot.activeTabId?.uuidString ?? "none")
                    row("Live WebViews", "\(snapshot.liveWebViewCount)")
                    row("Paused WebViews", "\(snapshot.pausedWebViewCount)")
                    row("Snapshot Cache", "\(snapshot.snapshotUsageBytes / 1024) KB")
                    row("Bridge Calls", "\(snapshot.bridgeCallCount)")
                    if let lastError = snapshot.lastError {
                        row("Last Error", "\(lastError.code.rawValue): \(lastError.message)")
                    }
                }

                Section("Servers") {
                    if snapshot.serverPorts.isEmpty {
                        row("Ports", "none")
                    } else {
                        ForEach(snapshot.serverPorts, id: \.self) { port in
                            row("Port", "\(port)")
                        }
                    }
                }

                Section("Tabs") {
                    ForEach(snapshot.tabs) { tab in
                        VStack(alignment: .leading, spacing: 6) {
                            Text(tab.title)
                                .font(.headline)
                            Text("\(tab.appId) · \(String(describing: tab.status))")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            Text(tab.serverURL?.absoluteString ?? "server: none")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                            Text(tab.hasWebView ? "webview: retained" : "webview: released")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                        .padding(.vertical, 4)
                    }
                }
            }
            .navigationTitle("Runtime Inspector")
        }
    }

    private func row(_ title: String, _ value: String) -> some View {
        HStack {
            Text(title)
            Spacer()
            Text(value)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.trailing)
        }
    }
}
#endif

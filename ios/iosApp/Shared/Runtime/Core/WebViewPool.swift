import Foundation
import WebKit

@MainActor
final class WebViewPool {
    private let limits: RuntimeLimits

    init(limits: RuntimeLimits) {
        self.limits = limits
    }

    func makeWebView(
        for tab: WebTab,
        bridgeRouter: BridgeRouter,
        processRecoveryManager: ProcessRecoveryManager,
        onRuntimeError: @escaping (RuntimeShellError) -> Void
    ) -> RuntimeWebView {
        RuntimeWebView(
            frame: .zero,
            manifest: tab.manifest,
            bundlePath: tab.bundlePath,
            serverURL: tab.serverURL ?? URL(string: "http://localhost:8080")!,
            tabId: tab.id,
            bridgeRouter: bridgeRouter,
            processRecoveryManager: processRecoveryManager,
            onRuntimeError: onRuntimeError
        )
    }

    func liveWebViewCount(in tabs: [WebTab]) -> Int {
        tabs.filter { $0.webView != nil && $0.status == .active }.count
    }

    func pausedWebViewCount(in tabs: [WebTab], activeTabId: UUID?) -> Int {
        tabs.filter { $0.id != activeTabId && $0.webView != nil && $0.status == .paused }.count
    }

    func destroyWebView(for tab: WebTab) {
        tab.webView?.stopLoading()
        tab.webView?.shutdownBridge()
        tab.webView = nil
    }

    func enforceRetainedWebViewLimit(
        tabs: [WebTab],
        activeTabId: UUID?,
        lruTabIds: [UUID],
        suspendTab: (WebTab) -> Void
    ) {
        var retainedCount = pausedWebViewCount(in: tabs, activeTabId: activeTabId)
        guard retainedCount > limits.maxPausedWebViews else { return }

        for lruId in lruTabIds where retainedCount > limits.maxPausedWebViews {
            guard lruId != activeTabId,
                  let tab = tabs.first(where: { $0.id == lruId }),
                  tab.status == .paused,
                  tab.webView != nil else { continue }
            suspendTab(tab)
            retainedCount -= 1
        }
    }
}

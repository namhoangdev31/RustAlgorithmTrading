import Foundation
import UIKit
import WebKit

struct RuntimeLimits {
    let maxLiveWebViews: Int
    let maxPausedWebViews: Int
    let maxTabs: Int
    let filesystemQuotaBytes: Int64
    let snapshotQuotaBytes: Int64
    let wasmMaxExecutionSeconds: TimeInterval
    let wasmMaxFileBytes: Int64

    static let phase4 = RuntimeLimits(
        maxLiveWebViews: 2,
        maxPausedWebViews: 3,
        maxTabs: 8,
        filesystemQuotaBytes: 100 * 1024 * 1024,
        snapshotQuotaBytes: 20 * 1024 * 1024,
        wasmMaxExecutionSeconds: 3.0,
        wasmMaxFileBytes: 128 * 1024 * 1024
    )
}

enum RuntimeShellAction: String, Codable, CaseIterable {
    case retry
    case rollback
    case clearData
    case report
    case close
}

enum RuntimeShellErrorCode: String, Codable {
    case bundleCorrupted = "BUNDLE_CORRUPTED"
    case signatureInvalid = "SIGNATURE_INVALID"
    case versionCrashed = "VERSION_CRASHED"
    case permissionDenied = "PERMISSION_DENIED"
    case networkUnavailable = "NETWORK_UNAVAILABLE"
    case serverFailedToStart = "SERVER_FAILED_TO_START"
    case webContentProcessKilled = "WEB_CONTENT_PROCESS_KILLED"
    case updateFailed = "UPDATE_FAILED"
    case quotaExceeded = "QUOTA_EXCEEDED"
    case bridgeRejected = "BRIDGE_REJECTED"
}

struct RuntimeShellError: Identifiable, Equatable {
    let code: RuntimeShellErrorCode
    let title: String
    let message: String
    let actions: [RuntimeShellAction]

    var id: String { "\(code.rawValue):\(message)" }

    static func serverFailed(_ message: String) -> RuntimeShellError {
        RuntimeShellError(
            code: .serverFailedToStart,
            title: "Server failed to start",
            message: message,
            actions: [.retry, .report, .close]
        )
    }

    static func crashedVersion(_ message: String) -> RuntimeShellError {
        RuntimeShellError(
            code: .versionCrashed,
            title: "Version crashed",
            message: message,
            actions: [.rollback, .report, .close]
        )
    }

    static func webContentKilled(_ message: String) -> RuntimeShellError {
        RuntimeShellError(
            code: .webContentProcessKilled,
            title: "Web content restarted",
            message: message,
            actions: [.retry, .rollback, .report]
        )
    }

    static func permissionDenied(_ message: String) -> RuntimeShellError {
        RuntimeShellError(
            code: .permissionDenied,
            title: "Permission denied",
            message: message,
            actions: [.retry, .report, .close]
        )
    }

    static func quotaExceeded(_ message: String) -> RuntimeShellError {
        RuntimeShellError(
            code: .quotaExceeded,
            title: "Runtime quota exceeded",
            message: message,
            actions: [.clearData, .report, .close]
        )
    }
}

struct RuntimeDiagnosticsSnapshot {
    struct TabStatus: Identifiable {
        let id: UUID
        let appId: String
        let title: String
        let status: WebTabStatus
        let hasWebView: Bool
        let serverURL: URL?
        let lastVisitedURL: URL?
        let snapshotPath: String?
    }

    let generatedAt: Date
    let activeTabId: UUID?
    let tabs: [TabStatus]
    let serverPorts: [UInt16]
    let liveWebViewCount: Int
    let pausedWebViewCount: Int
    let snapshotUsageBytes: Int64
    let bridgeCallCount: Int
    let lastError: RuntimeShellError?
}

@MainActor
final class RuntimeKernel {
    let limits: RuntimeLimits
    let serverRegistry: ServerRegistry
    let bridgeRouter: BridgeRouter
    let pluginHost: PluginHost
    let processRecoveryManager: ProcessRecoveryManager
    let resourceGovernor: ResourceGovernor
    let webViewPool: WebViewPool
    let updateCoordinator: UpdateCoordinator
    let stateStore: RuntimeStateStore
    let lifecycleCoordinator: AppShellLifecycleCoordinator

    init(
        limits: RuntimeLimits = .phase4,
        serverRegistry: ServerRegistry = .shared,
        pluginHost: PluginHost = .shared
    ) {
        self.limits = limits
        self.serverRegistry = serverRegistry
        self.pluginHost = pluginHost
        self.resourceGovernor = ResourceGovernor(limits: limits)
        self.processRecoveryManager = ProcessRecoveryManager()
        self.bridgeRouter = BridgeRouter(pluginHost: pluginHost)
        self.webViewPool = WebViewPool(limits: limits)
        self.updateCoordinator = UpdateCoordinator()
        self.stateStore = RuntimeStateStore()
        self.lifecycleCoordinator = AppShellLifecycleCoordinator()
    }

    func prepareLaunch(
        manifest: WebRuntimeManifest,
        bundlePath: URL,
        completion: @escaping (Result<URL, Error>) -> Void
    ) {
        updateCoordinator.prepareLaunch(manifest: manifest, bundlePath: bundlePath, completion: completion)
    }

    func makeWebView(
        for tab: WebTab,
        onRuntimeError: @escaping (RuntimeShellError) -> Void
    ) -> RuntimeWebView {
        webViewPool.makeWebView(
            for: tab,
            bridgeRouter: bridgeRouter,
            processRecoveryManager: processRecoveryManager,
            onRuntimeError: onRuntimeError
        )
    }

    func diagnosticsSnapshot(
        tabs: [WebTab],
        activeTabId: UUID?,
        lastError: RuntimeShellError?
    ) -> RuntimeDiagnosticsSnapshot {
        let tabStatuses = tabs.map { tab in
            RuntimeDiagnosticsSnapshot.TabStatus(
                id: tab.id,
                appId: tab.manifest.id,
                title: tab.title,
                status: tab.status,
                hasWebView: tab.webView != nil,
                serverURL: tab.serverURL,
                lastVisitedURL: tab.lastVisitedURL,
                snapshotPath: TabSnapshotManager.shared.snapshotPath(for: tab.id)
            )
        }

        return RuntimeDiagnosticsSnapshot(
            generatedAt: Date(),
            activeTabId: activeTabId,
            tabs: tabStatuses,
            serverPorts: tabs.compactMap { $0.serverURL?.port }.map(UInt16.init),
            liveWebViewCount: webViewPool.liveWebViewCount(in: tabs),
            pausedWebViewCount: webViewPool.pausedWebViewCount(in: tabs, activeTabId: activeTabId),
            snapshotUsageBytes: TabSnapshotManager.shared.totalSnapshotBytes(),
            bridgeCallCount: BridgeAuditLogger.shared.totalLoggedCalls,
            lastError: lastError
        )
    }
}

final class RuntimeStateStore {
    func persistTabs(_ tabs: [WebTab], activeTabId: UUID?) {
        let persistData = tabs.map { tab in
            DatabaseService.TabPersistData(
                id: tab.id.uuidString,
                appId: tab.manifest.id,
                version: tab.manifest.version,
                lastUrl: tab.lastVisitedURL?.absoluteString,
                snapshotPath: TabSnapshotManager.shared.snapshotPath(for: tab.id),
                status: tab.id == activeTabId ? "active" : String(describing: tab.status)
            )
        }
        
        Task {
            await DatabaseService.shared.persistTabs(tabs: persistData, activeTabId: activeTabId?.uuidString)
        }
    }

    func recordPendingUpdate(appId: String, version: String, status: String, error: String? = nil) {
        Task {
            await DatabaseService.shared.recordPendingUpdate(appId: appId, version: version, status: status, error: error)
        }
    }
}

@MainActor
final class AppShellLifecycleCoordinator {
    func handleDidEnterBackground(
        tabs: [WebTab],
        activeTab: WebTab?,
        pauseActiveTab: (WebTab) -> Void,
        persistState: () -> Void
    ) {
        let keepTabIds = tabs.map(\.id)
        final class BackgroundTaskRef: @unchecked Sendable {
            var id: UIBackgroundTaskIdentifier = .invalid
        }
        let taskRef = BackgroundTaskRef()
        taskRef.id = UIApplication.shared.beginBackgroundTask(withName: "com.antigravity.runtime.stateflush") {
            UIApplication.shared.endBackgroundTask(taskRef.id)
        }

        if let activeTab {
            pauseActiveTab(activeTab)
        }
        persistState()
        TabSnapshotManager.shared.clearOrphanedSnapshots(keepTabIds: keepTabIds)
        UIApplication.shared.endBackgroundTask(taskRef.id)
    }

    func handleWillTerminate(tabs: [WebTab], persistState: () -> Void, stopAll: () -> Void) {
        persistState()
        stopAll()
    }
}

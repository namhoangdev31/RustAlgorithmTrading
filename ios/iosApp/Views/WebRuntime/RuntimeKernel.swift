import Foundation
import GRDB
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
        let now = Date()
        do {
            try MiniAppDatabase.shared.write { db in
                try db.execute(sql: "DELETE FROM recent_tabs")

                for tab in tabs {
                    try db.execute(sql: """
                        INSERT INTO recent_tabs (id, app_id, version, last_url, snapshot_path, status, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, arguments: [
                        tab.id.uuidString,
                        tab.manifest.id,
                        tab.manifest.version,
                        tab.lastVisitedURL?.absoluteString,
                        TabSnapshotManager.shared.snapshotPath(for: tab.id),
                        tab.id == activeTabId ? "active" : String(describing: tab.status),
                        now
                    ])
                }

                try db.execute(sql: """
                    INSERT INTO runtime_sessions (session_id, active_tab_id, updated_at)
                    VALUES ('default', ?, ?)
                    ON CONFLICT(session_id) DO UPDATE SET
                        active_tab_id = excluded.active_tab_id,
                        updated_at = excluded.updated_at
                """, arguments: [activeTabId?.uuidString, now])
            }
        } catch {
            print("[RuntimeStateStore] Failed to persist runtime state: \(error.localizedDescription)")
        }
    }

    func recordPendingUpdate(appId: String, version: String, status: String, error: String? = nil) {
        do {
            try MiniAppDatabase.shared.write { db in
                try db.execute(sql: """
                    INSERT INTO pending_updates (app_id, version, status, error_message, updated_at)
                    VALUES (?, ?, ?, ?, ?)
                    ON CONFLICT(app_id, version) DO UPDATE SET
                        status = excluded.status,
                        error_message = excluded.error_message,
                        updated_at = excluded.updated_at
                """, arguments: [appId, version, status, error, Date()])
            }
        } catch {
            print("[RuntimeStateStore] Failed to record pending update: \(error.localizedDescription)")
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

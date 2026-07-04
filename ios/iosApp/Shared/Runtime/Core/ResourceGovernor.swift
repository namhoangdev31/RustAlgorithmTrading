import Foundation

final class ResourceGovernor {
    private let limits: RuntimeLimits
    private let fileManager = FileManager.default

    init(limits: RuntimeLimits = .phase4) {
        self.limits = limits
    }

    func canOpenTab(currentCount: Int) -> Bool {
        currentCount < limits.maxTabs
    }

    @MainActor
    func enforceTabBudget(
        tabs: [WebTab],
        activeTabId: UUID?,
        lruTabIds: [UUID],
        suspendTab: (WebTab) -> Void
    ) {
        WebViewPool(limits: limits).enforceRetainedWebViewLimit(
            tabs: tabs,
            activeTabId: activeTabId,
            lruTabIds: lruTabIds,
            suspendTab: suspendTab
        )

        TabSnapshotManager.shared.cleanupIfNeeded(maxBytes: limits.snapshotQuotaBytes)
    }

    func validateFilesystemWrite(appId: String, additionalBytes: Int64) -> RuntimeShellError? {
        let used = directorySize(for: appDataDirectory(appId: appId))
        
        // Dynamic Quota Tiers:
        // Default Mini App: 50MB
        // Trusted Mini App: 200MB
        // First-party / System Mini App: 500MB
        var quotaLimitBytes: Int64 = 50 * 1024 * 1024 // 50MB Default
        if appId.hasPrefix("com.lepos.system") || appId.hasPrefix("com.lepos.firstparty") {
            quotaLimitBytes = 500 * 1024 * 1024 // 500MB
        } else if appId.hasSuffix(".trusted") || appId.contains(".verified") {
            quotaLimitBytes = 200 * 1024 * 1024 // 200MB
        }
        
        guard used + additionalBytes <= quotaLimitBytes else {
            return .quotaExceeded("Filesystem quota exceeded for \(appId). Limit is \(quotaLimitBytes / 1024 / 1024)MB.")
        }
        return nil
    }

    func validateWasmFile(path: String) -> RuntimeShellError? {
        guard let attrs = try? fileManager.attributesOfItem(atPath: path),
              let size = attrs[.size] as? NSNumber else {
            return nil
        }

        if size.int64Value > limits.wasmMaxFileBytes {
            return .quotaExceeded("WASM file exceeds \(limits.wasmMaxFileBytes / 1024 / 1024)MB.")
        }
        return nil
    }

    func validateWasmDuration(_ duration: TimeInterval) -> RuntimeShellError? {
        guard duration <= limits.wasmMaxExecutionSeconds else {
            return .quotaExceeded("WASM execution exceeded \(limits.wasmMaxExecutionSeconds)s.")
        }
        return nil
    }

    private func appDataDirectory(appId: String) -> URL {
        fileManager.urls(for: .documentDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("MiniAppsData", isDirectory: true)
            .appendingPathComponent(appId, isDirectory: true)
    }

    private func directorySize(for url: URL) -> Int64 {
        guard let enumerator = fileManager.enumerator(
            at: url,
            includingPropertiesForKeys: [.fileSizeKey],
            options: [.skipsHiddenFiles]
        ) else {
            return 0
        }

        var total: Int64 = 0
        for case let fileURL as URL in enumerator {
            guard let values = try? fileURL.resourceValues(forKeys: [.fileSizeKey]) else { continue }
            total += Int64(values.fileSize ?? 0)
        }
        return total
    }
}

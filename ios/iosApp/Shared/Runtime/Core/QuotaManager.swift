import Foundation

/// Policy manager evaluating active resource utilization and coordinating governor countermeasures
@MainActor
final class QuotaManager {
    static let shared = QuotaManager()
    
    private let policy: RuntimeQuotaPolicy
    private let governor: ResourceGovernor
    
    init(policy: RuntimeQuotaPolicy = .standard, governor: ResourceGovernor = ResourceGovernor()) {
        self.policy = policy
        self.governor = governor
    }
    
    /// Checks if a filesystem write is allowed, raising quota warnings or rejecting if limits are exceeded.
    func checkFilesystemWrite(appId: String, additionalBytes: Int64) -> Result<Void, Error> {
        if let error = governor.validateFilesystemWrite(appId: appId, additionalBytes: additionalBytes) {
            Task {
                await RuntimeEventBus.shared.publish(.quotaExceeded(appId: appId, detail: error.message))
            }
            let nsErr = NSError(
                domain: "QuotaManager",
                code: 413,
                userInfo: [NSLocalizedDescriptionKey: error.message]
            )
            return .failure(nsErr)
        }
        return .success(())
    }
    
    /// Checks Wasm file compilation limits.
    func checkWasmFile(appId: String, path: String) -> Result<Void, Error> {
        if let error = governor.validateWasmFile(path: path) {
            Task {
                await RuntimeEventBus.shared.publish(.quotaExceeded(appId: appId, detail: error.message))
            }
            let nsErr = NSError(
                domain: "QuotaManager",
                code: 413,
                userInfo: [NSLocalizedDescriptionKey: error.message]
            )
            return .failure(nsErr)
        }
        return .success(())
    }
    
    /// Checks Wasm execution duration.
    func checkWasmDuration(appId: String, duration: TimeInterval) -> Result<Void, Error> {
        if let error = governor.validateWasmDuration(duration) {
            Task {
                await RuntimeEventBus.shared.publish(.quotaExceeded(appId: appId, detail: error.message))
            }
            let nsErr = NSError(
                domain: "QuotaManager",
                code: 408,
                userInfo: [NSLocalizedDescriptionKey: error.message]
            )
            return .failure(nsErr)
        }
        return .success(())
    }
}

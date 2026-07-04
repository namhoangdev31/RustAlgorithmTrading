import Foundation

/// Allocation Policy representing specific resource quota limits for a Mini App
struct RuntimeQuotaPolicy: Sendable {
    let maxFilesystemBytes: Int64
    let maxSnapshotBytes: Int64
    let maxBundleCacheBytes: Int64
    let maxWasmFileBytes: Int64
    let maxWasmExecutionSeconds: TimeInterval
    let maxBridgeCallsPerMin: Int
    
    static let standard = RuntimeQuotaPolicy(
        maxFilesystemBytes: 100 * 1024 * 1024,   // 100MB
        maxSnapshotBytes: 20 * 1024 * 1024,      // 20MB
        maxBundleCacheBytes: 300 * 1024 * 1024,  // 300MB
        maxWasmFileBytes: 128 * 1024 * 1024,     // 128MB
        maxWasmExecutionSeconds: 3.0,            // 3s
        maxBridgeCallsPerMin: 100                // 100/min
    )
}

import Foundation

/// Asynchronous Telemetry reporter gathering and logging performance metrics
final class RuntimeTelemetry: @unchecked Sendable {
    static let shared = RuntimeTelemetry()
    
    private init() {}
    
    /// Enqueues a metric reporting operation on the shared actor store
    func logMetric(_ metric: RuntimeMetric) {
        Task {
            switch metric {
            case .coldStartMs(let value):
                await RuntimeMetricStore.shared.recordMetric(key: "coldStartMs", value: value)
            case .warmStartMs(let value):
                await RuntimeMetricStore.shared.recordMetric(key: "warmStartMs", value: value)
            case .resumeMs(let value):
                await RuntimeMetricStore.shared.recordMetric(key: "resumeMs", value: value)
            case .bridgeLatencyMs(let action, let value):
                await RuntimeMetricStore.shared.recordMetric(key: "bridgeLatencyMs_\(action)", value: value)
            case .pluginLatencyMs(let plugin, let value):
                await RuntimeMetricStore.shared.recordMetric(key: "pluginLatencyMs_\(plugin)", value: value)
            case .wasmExecutionMs(let wasmFile, let value):
                await RuntimeMetricStore.shared.recordMetric(key: "wasmExecutionMs_\(wasmFile)", value: value)
            case .snapshotTimeMs(let value):
                await RuntimeMetricStore.shared.recordMetric(key: "snapshotTimeMs", value: value)
            case .otaInstallMs(let version, let value):
                await RuntimeMetricStore.shared.recordMetric(key: "otaInstallMs_\(version)", value: value)
            case .rollbackCount:
                await RuntimeMetricStore.shared.incrementCounter(key: "rollbackCount")
            case .webProcessKillCount:
                await RuntimeMetricStore.shared.incrementCounter(key: "webProcessKillCount")
            case .serverStartMs(let value):
                await RuntimeMetricStore.shared.recordMetric(key: "serverStartMs", value: value)
            }
        }
    }
}

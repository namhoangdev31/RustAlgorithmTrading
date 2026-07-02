import Foundation

/// Performance metric types recorded by runtime telemetry
enum RuntimeMetric: Sendable {
    case coldStartMs(Double)
    case warmStartMs(Double)
    case resumeMs(Double)
    case bridgeLatencyMs(action: String, Double)
    case pluginLatencyMs(plugin: String, Double)
    case wasmExecutionMs(wasmFile: String, Double)
    case snapshotTimeMs(Double)
    case otaInstallMs(version: String, Double)
    case rollbackCount
    case webProcessKillCount
    case serverStartMs(Double)
}

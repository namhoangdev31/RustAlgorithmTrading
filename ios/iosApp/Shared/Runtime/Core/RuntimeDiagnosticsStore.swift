import Foundation

/// Diagnostics Store keeping history snapshots of internal webview pool, servers, and telemetry stats
@MainActor
final class RuntimeDiagnosticsStore {
    static let shared = RuntimeDiagnosticsStore()
    
    private var snapshotsHistory: [RuntimeDiagnosticsSnapshot] = []
    
    private init() {}
    
    /// Records a diagnostic snapshot, capping history length to 50 entries
    func recordSnapshot(_ snapshot: RuntimeDiagnosticsSnapshot) {
        snapshotsHistory.append(snapshot)
        if snapshotsHistory.count > 50 {
            snapshotsHistory.removeFirst()
        }
    }
    
    /// Retrieves the most recent diagnostic snapshot
    func getLatestSnapshot() -> RuntimeDiagnosticsSnapshot? {
        return snapshotsHistory.last
    }
    
    /// Retrieves full snapshots history
    func getHistory() -> [RuntimeDiagnosticsSnapshot] {
        return snapshotsHistory
    }
}

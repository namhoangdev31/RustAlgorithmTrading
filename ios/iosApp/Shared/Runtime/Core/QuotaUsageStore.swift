import Foundation

/// Thread-safe in-memory cache and store for real-time allocation measurements
actor QuotaUsageStore {
    static let shared = QuotaUsageStore()
    
    private var filesystemUsage: [String: Int64] = [:]
    private var snapshotUsage: [String: Int64] = [:]
    
    private init() {}
    
    func getFilesystemUsage(appId: String) -> Int64 {
        return filesystemUsage[appId] ?? 0
    }
    
    func setFilesystemUsage(appId: String, bytes: Int64) {
        filesystemUsage[appId] = bytes
    }
    
    func getSnapshotUsage(appId: String) -> Int64 {
        return snapshotUsage[appId] ?? 0
    }
    
    func setSnapshotUsage(appId: String, bytes: Int64) {
        snapshotUsage[appId] = bytes
    }
}

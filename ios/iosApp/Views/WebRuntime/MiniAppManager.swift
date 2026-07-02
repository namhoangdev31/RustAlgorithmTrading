import Foundation
import GRDB

/// Central Coordinator overseeing launch registration, crash protection, and version rollback recovery
final class MiniAppManager {
    static let shared = MiniAppManager()
    
    private let fileManager = FileManager.default
    
    private init() {}
    
    /// Registers a launch attempt for the given app and version.
    /// If launch attempts >= 3, automatically triggers a rollback to the last stable version.
    func registerLaunch(appId: String, currentVersion: String, completion: @escaping (Result<URL, Error>) -> Void) {
        do {
            // 1. Increment launch attempts in SQLite
            try MiniAppDatabase.shared.write { db in
                try db.execute(sql: """
                    UPDATE bundle_history
                    SET launch_attempts = launch_attempts + 1
                    WHERE app_id = ? AND version = ?
                """, arguments: [appId, currentVersion])
            }
            
            // 2. Fetch current launch attempts
            var attempts = 0
            try MiniAppDatabase.shared.read { db in
                let row = try Row.fetchOne(db, sql: """
                    SELECT launch_attempts FROM bundle_history
                    WHERE app_id = ? AND version = ?
                """, arguments: [appId, currentVersion])
                attempts = row?["launch_attempts"] ?? 0
            }
            
            print("[MiniAppManager] App \(appId) version \(currentVersion) launch attempt: \(attempts)")
            
            if attempts >= 3 {
                print("[MiniAppManager] Launch attempts threshold exceeded. Triggering rollback!")
                rollback(appId: appId, failedVersion: currentVersion, completion: completion)
            } else {
                // Return path to current version directory
                let documentsURL = fileManager.urls(for: .documentDirectory, in: .userDomainMask)[0]
                let versionDirectory = documentsURL
                    .appendingPathComponent("MiniApps", isDirectory: true)
                    .appendingPathComponent(appId, isDirectory: true)
                    .appendingPathComponent("versions", isDirectory: true)
                    .appendingPathComponent(currentVersion, isDirectory: true)
                
                completion(.success(versionDirectory))
            }
        } catch {
            print("[MiniAppManager] Failed to register launch: \(error.localizedDescription)")
            completion(.failure(error))
        }
    }
    
    /// Resets the launch attempts for the version, marking it as stable in SQLite
    func markStable(appId: String, version: String) {
        do {
            try MiniAppDatabase.shared.write { db in
                try db.execute(sql: """
                    UPDATE bundle_history
                    SET launch_attempts = 0
                    WHERE app_id = ? AND version = ?
                """, arguments: [appId, version])
                
                try db.execute(sql: """
                    UPDATE mini_apps
                    SET last_stable_version = ?
                    WHERE id = ?
                """, arguments: [version, appId])
            }
            print("[MiniAppManager] App \(appId) version \(version) marked stable.")
        } catch {
            print("[MiniAppManager] Failed to mark version stable: \(error.localizedDescription)")
        }
    }
    
    /// Rolls back the active version in SQLite to the last stable version
    func rollback(appId: String, failedVersion: String, completion: @escaping (Result<URL, Error>) -> Void) {
        do {
            let documentsURL = fileManager.urls(for: .documentDirectory, in: .userDomainMask)[0]
            let appDirectory = documentsURL
                .appendingPathComponent("MiniApps", isDirectory: true)
                .appendingPathComponent(appId, isDirectory: true)
            let versionsDirectory = appDirectory.appendingPathComponent("versions", isDirectory: true)
            
            // 1. Query the last stable version from DB
            var stableVersion: String?
            try MiniAppDatabase.shared.read { db in
                let row = try Row.fetchOne(db, sql: """
                    SELECT last_stable_version FROM mini_apps WHERE id = ?
                """, arguments: [appId])
                stableVersion = row?["last_stable_version"]
                
                // Fallback: If last_stable_version is nil, query the latest active version in history that is not the failed version
                if stableVersion == nil {
                    let fallbackRow = try Row.fetchOne(db, sql: """
                        SELECT version FROM bundle_history
                        WHERE app_id = ? AND version != ? AND status = 'active'
                        ORDER BY installed_at DESC LIMIT 1
                    """, arguments: [appId, failedVersion])
                    stableVersion = fallbackRow?["version"]
                }
            }
            
            guard let versionToRestore = stableVersion else {
                throw NSError(
                    domain: "MiniAppManager",
                    code: 404,
                    userInfo: [NSLocalizedDescriptionKey: "No stable version found to roll back to."]
                )
            }
            
            let restoreVersionDirectory = versionsDirectory.appendingPathComponent(versionToRestore, isDirectory: true)
            guard fileManager.fileExists(atPath: restoreVersionDirectory.path) else {
                throw NSError(
                    domain: "MiniAppManager",
                    code: 404,
                    userInfo: [NSLocalizedDescriptionKey: "Stable version directory \(versionToRestore) is missing on disk."]
                )
            }
            
            // 2. Perform atomic version update in SQLite transaction
            try MiniAppDatabase.shared.write { db in
                try db.execute(sql: """
                    UPDATE mini_apps
                    SET current_version = ?, status = 'active'
                    WHERE id = ?
                """, arguments: [versionToRestore, appId])
                
                try db.execute(sql: """
                    UPDATE bundle_history
                    SET status = 'failed'
                    WHERE app_id = ? AND version = ?
                """, arguments: [appId, failedVersion])
            }
            
            print("[MiniAppManager] Successfully rolled back \(appId) from \(failedVersion) to stable \(versionToRestore)")
            completion(.success(restoreVersionDirectory))
        } catch {
            print("[MiniAppManager] Rollback failed: \(error.localizedDescription)")
            completion(.failure(error))
        }
    }
}

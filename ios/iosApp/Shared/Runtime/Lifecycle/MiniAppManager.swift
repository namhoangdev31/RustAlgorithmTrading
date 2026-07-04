import Foundation

/// Central Coordinator overseeing launch registration, crash protection, and version rollback recovery
final class MiniAppManager {
    static let shared = MiniAppManager()
    
    private let fileManager = FileManager.default
    
    private init() {}
    
    /// Registers a launch attempt for the given app and version.
    /// If launch attempts >= 3, automatically triggers a rollback to the last stable version.
    func registerLaunch(appId: String, currentVersion: String, completion: @escaping (Result<URL, Error>) -> Void) {
        Task {
            let (activeVersion, attempts) = await DatabaseService.shared.registerLaunch(appId: appId, currentVersion: currentVersion)
            
            print("[MiniAppManager] App \(appId) version \(activeVersion) launch attempt: \(attempts)")
            
            if attempts >= 3 {
                print("[MiniAppManager] Launch attempts threshold exceeded. Triggering rollback!")
                rollback(appId: appId, failedVersion: activeVersion, completion: completion)
            } else {
                // Return path to current version directory
                let documentsURL = fileManager.urls(for: .documentDirectory, in: .userDomainMask)[0]
                let versionDirectory = documentsURL
                    .appendingPathComponent("MiniApps", isDirectory: true)
                    .appendingPathComponent(appId, isDirectory: true)
                    .appendingPathComponent("versions", isDirectory: true)
                    .appendingPathComponent(activeVersion, isDirectory: true)
                
                completion(.success(versionDirectory))
            }
        }
    }
    
    /// Resets the launch attempts for the version, marking it as stable in SQLite
    func markStable(appId: String, version: String) {
        Task {
            await DatabaseService.shared.markStable(appId: appId, version: version)
            print("[MiniAppManager] App \(appId) version \(version) marked stable.")
        }
    }
    
    /// Rolls back the active version in SQLite to the last stable version
    func rollback(appId: String, failedVersion: String, completion: @escaping (Result<URL, Error>) -> Void) {
        Task {
            let documentsURL = fileManager.urls(for: .documentDirectory, in: .userDomainMask)[0]
            let appDirectory = documentsURL
                .appendingPathComponent("MiniApps", isDirectory: true)
                .appendingPathComponent(appId, isDirectory: true)
            let versionsDirectory = appDirectory.appendingPathComponent("versions", isDirectory: true)
            
            guard let versionToRestore = await DatabaseService.shared.getStableVersionForRollback(appId: appId, failedVersion: failedVersion) else {
                completion(.failure(NSError(
                    domain: "MiniAppManager",
                    code: 404,
                    userInfo: [NSLocalizedDescriptionKey: "No stable version found to roll back to."]
                )))
                return
            }
            
            let restoreVersionDirectory = versionsDirectory.appendingPathComponent(versionToRestore, isDirectory: true)
            guard fileManager.fileExists(atPath: restoreVersionDirectory.path) else {
                completion(.failure(NSError(
                    domain: "MiniAppManager",
                    code: 404,
                    userInfo: [NSLocalizedDescriptionKey: "Stable version directory \(versionToRestore) is missing on disk."]
                )))
                return
            }
            
            await DatabaseService.shared.rollbackVersion(appId: appId, failedVersion: failedVersion, restoreVersion: versionToRestore)
            print("[MiniAppManager] Successfully rolled back \(appId) from \(failedVersion) to stable \(versionToRestore)")
            completion(.success(restoreVersionDirectory))
        }
    }
}

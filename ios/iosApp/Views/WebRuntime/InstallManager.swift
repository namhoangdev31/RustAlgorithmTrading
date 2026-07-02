import Foundation
import ZIPFoundation
import GRDB

enum InstallError: Error, LocalizedError {
    case unzippingFailed
    case verificationFailed
    case atomicSwapFailed
    
    var errorDescription: String? {
        switch self {
        case .unzippingFailed: return "Failed to unzip the bundle file."
        case .verificationFailed: return "Bundle cryptographic verification failed."
        case .atomicSwapFailed: return "Atomic folder swap failed."
        }
    }
}

/// Installation Manager overseeing atomic unzip, verification, SQLite state transactions, and version retention
final class InstallManager {
    static let shared = InstallManager()
    
    private let fileManager = FileManager.default
    private let queue = DispatchQueue(label: "com.antigravity.installmanager", qos: .userInitiated)
    
    private init() {}
    
    /// Unzips, cryptographically verifies, and installs a Mini App bundle to versions directory
    func install(
        zipURL: URL,
        appId: String,
        appName: String,
        version: String,
        sha256: String,
        completion: @escaping (Result<URL, Error>) -> Void
    ) {
        queue.async { [weak self] in
            guard let self = self else { return }
            do {
                // 1. Set up directories
                let documentsURL = self.fileManager.urls(for: .documentDirectory, in: .userDomainMask)[0]
                let appDirectory = documentsURL
                    .appendingPathComponent("MiniApps", isDirectory: true)
                    .appendingPathComponent(appId, isDirectory: true)
                let versionsDirectory = appDirectory.appendingPathComponent("versions", isDirectory: true)
                let versionDirectory = versionsDirectory.appendingPathComponent(version, isDirectory: true)
                
                // Temporary directory for unzipping
                let tmpDirectory = appDirectory
                    .appendingPathComponent("tmp", isDirectory: true)
                    .appendingPathComponent(UUID().uuidString, isDirectory: true)
                
                try? self.fileManager.removeItem(at: tmpDirectory)
                try self.fileManager.createDirectory(at: tmpDirectory, withIntermediateDirectories: true, attributes: nil)
                
                // 2. Unzip into staging
                try self.fileManager.unzipItem(at: zipURL, to: tmpDirectory)
                
                // 3. Cryptographically verify signature and hashes
                guard BundleVerifier.verify(bundleDirectory: tmpDirectory) else {
                    throw InstallError.verificationFailed
                }
                
                // 4. Move from tmp to target version directory
                try? self.fileManager.removeItem(at: versionDirectory)
                try self.fileManager.createDirectory(at: versionsDirectory, withIntermediateDirectories: true, attributes: nil)
                try self.fileManager.moveItem(at: tmpDirectory, to: versionDirectory)
                
                // 5. Update SQLite registry via transaction
                try MiniAppDatabase.shared.write { db in
                    // Retrieve existing current_version to set as last_stable_version
                    let oldAppRow = try Row.fetchOne(db, sql: "SELECT current_version FROM mini_apps WHERE id = ?", arguments: [appId])
                    let lastStableVersion = oldAppRow?["current_version"] as String?
                    
                    // Upsert mini_apps table entry
                    try db.execute(sql: """
                        INSERT INTO mini_apps (id, name, current_version, last_stable_version, status)
                        VALUES (?, ?, ?, ?, 'active')
                        ON CONFLICT(id) DO UPDATE SET
                            name = excluded.name,
                            current_version = excluded.current_version,
                            last_stable_version = COALESCE(excluded.last_stable_version, current_version),
                            status = 'active'
                    """, arguments: [appId, appName, version, lastStableVersion])
                    
                    // Insert into bundle_history
                    try db.execute(sql: """
                        INSERT INTO bundle_history (app_id, version, path, sha256, status, launch_attempts)
                        VALUES (?, ?, ?, ?, 'active', 0)
                    """, arguments: [appId, version, versionDirectory.path, sha256])
                }
                
                // 6. Clean up older folders but keep the last 2-3 versions
                self.cleanupOldVersions(versionsDir: versionsDirectory, keepVersions: [version])
                
                // Clean up zipURL
                try? self.fileManager.removeItem(at: zipURL)
                
                print("[InstallManager] Successfully installed version \(version) for \(appId)")
                completion(.success(versionDirectory))
            } catch {
                print("[InstallManager] Installation failed: \(error.localizedDescription)")
                try? self.fileManager.removeItem(at: zipURL)
                completion(.failure(error))
            }
        }
    }
    
    private func cleanupOldVersions(versionsDir: URL, keepVersions: [String]) {
        DispatchQueue.global(qos: .background).async { [weak self] in
            guard let self = self else { return }
            do {
                let db = MiniAppDatabase.shared
                var versionsToKeep = keepVersions
                
                // Query last 3 active versions from history database to prevent deletion
                try db.read { db in
                    let rows = try Row.fetchAll(db, sql: """
                        SELECT version FROM bundle_history
                        WHERE app_id = (SELECT app_id FROM bundle_history WHERE path LIKE ? LIMIT 1)
                          AND status = 'active'
                        ORDER BY installed_at DESC LIMIT 3
                    """, arguments: ["%\(versionsDir.lastPathComponent)%"])
                    
                    for row in rows {
                        if let ver = row["version"] as String?, !versionsToKeep.contains(ver) {
                            versionsToKeep.append(ver)
                        }
                    }
                }
                
                guard let contents = try? self.fileManager.contentsOfDirectory(at: versionsDir, includingPropertiesForKeys: nil, options: []) else { return }
                
                for folderURL in contents {
                    let folderName = folderURL.lastPathComponent
                    if !versionsToKeep.contains(folderName) {
                        try? self.fileManager.removeItem(at: folderURL)
                        print("[InstallManager] Cleaned up older version folder: \(folderName)")
                    }
                }
            } catch {
                print("[InstallManager] Cleanup of old versions failed: \(error.localizedDescription)")
            }
        }
    }
}

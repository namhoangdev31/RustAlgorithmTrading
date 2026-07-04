import Foundation
import ZIPFoundation

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
        isOTAUpdate: Bool = false,
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
                
                // 5. Update registry asynchronously using Task and DatabaseService
                Task {
                    await DatabaseService.shared.installOrUpdateApp(
                        appId: appId,
                        name: appName,
                        version: version,
                        path: versionDirectory.path,
                        sha256: sha256,
                        isOTAUpdate: isOTAUpdate
                    )
                    
                    // 6. Clean up older folders but keep the last 2-3 versions
                    self.cleanupOldVersions(versionsDir: versionsDirectory, keepVersions: [version])
                    
                    // Clean up zipURL
                    try? self.fileManager.removeItem(at: zipURL)
                    
                    print("[InstallManager] Successfully installed version \(version) for \(appId)")
                    completion(.success(versionDirectory))
                }
            } catch {
                print("[InstallManager] Installation failed: \(error.localizedDescription)")
                try? self.fileManager.removeItem(at: zipURL)
                completion(.failure(error))
            }
        }
    }
    
    private func cleanupOldVersions(versionsDir: URL, keepVersions: [String]) {
        Task { [weak self] in
            guard let self = self else { return }
            var versionsToKeep = keepVersions
            
            // Query last 3 active versions from history database to prevent deletion
            let activeVersions = await DatabaseService.shared.cleanupOldVersions(versionsDirName: versionsDir.lastPathComponent)
            for ver in activeVersions {
                if !versionsToKeep.contains(ver) {
                    versionsToKeep.append(ver)
                }
            }
            
            do {
                guard let contents = try? self.fileManager.contentsOfDirectory(at: versionsDir, includingPropertiesForKeys: nil, options: []) else { return }
                
                for folderURL in contents {
                    let folderName = folderURL.lastPathComponent
                    if !versionsToKeep.contains(folderName) {
                        try self.fileManager.removeItem(at: folderURL)
                        print("[InstallManager] Cleaned up older version folder: \(folderName)")
                    }
                }
            } catch {
                print("[InstallManager] Cleanup of old versions failed: \(error.localizedDescription)")
            }
        }
    }
}

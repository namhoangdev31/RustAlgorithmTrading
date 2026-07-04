import Foundation

/// Update Manager orchestrating background OTA update download, verification, and staging processes
final class UpdateManager {
    static let shared = UpdateManager()
    
    private init() {}
    
    /// Downloads, verifies, and registers an OTA update as a pending SQLite history version
    func downloadAndInstallOTAUpdate(
        appId: String,
        appName: String,
        version: String,
        sha256: String,
        bundleURL: URL,
        completion: @escaping (Result<URL, Error>) -> Void
    ) {
        print("[UpdateManager] Starting background OTA download for \(appId) version \(version)...")
        
        DownloadManager.shared.downloadBundle(from: bundleURL) { result in
            switch result {
            case .success(let localZipURL):
                print("[UpdateManager] Download completed. Handing over to InstallManager staging...")
                InstallManager.shared.install(
                    zipURL: localZipURL,
                    appId: appId,
                    appName: appName,
                    version: version,
                    sha256: sha256,
                    isOTAUpdate: true
                ) { installResult in
                    switch installResult {
                    case .success(let versionURL):
                        print("[UpdateManager] OTA update version \(version) successfully staged for \(appId) as pending.")
                        completion(.success(versionURL))
                    case .failure(let error):
                        completion(.failure(error))
                    }
                }
            case .failure(let error):
                print("[UpdateManager] Background update download failed: \(error.localizedDescription)")
                completion(.failure(error))
            }
        }
    }
}

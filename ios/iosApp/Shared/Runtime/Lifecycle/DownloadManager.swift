import Foundation

/// Centralized Download Manager to handle downloading zip bundles to temporary staging
final class DownloadManager {
    static let shared = DownloadManager()
    
    private init() {}
    
    /// Downloads a Mini App bundle to a temporary file URL
    func downloadBundle(from url: URL, completion: @escaping (Result<URL, Error>) -> Void) {
        let task = URLSession.shared.downloadTask(with: url) { localURL, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let localURL = localURL else {
                let downloadError = NSError(
                    domain: "DownloadManager",
                    code: 500,
                    userInfo: [NSLocalizedDescriptionKey: "Failed to resolve downloaded local temp URL."]
                )
                completion(.failure(downloadError))
                return
            }
            
            let tempDir = FileManager.default.temporaryDirectory
            let targetURL = tempDir.appendingPathComponent(UUID().uuidString + ".zip")
            
            do {
                try? FileManager.default.removeItem(at: targetURL)
                try FileManager.default.moveItem(at: localURL, to: targetURL)
                completion(.success(targetURL))
            } catch {
                completion(.failure(error))
            }
        }
        task.resume()
    }
}

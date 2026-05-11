import Foundation
import ZIPFoundation
// import Shared — replaced by native Swift Shared module

/// iOS implementation of BundleDownloader conforming to BundleDownloader
class iOSBundleDownloader: NSObject, BundleDownloader {

    private let baseUrl: String

    init(baseUrl: String) {
        self.baseUrl = baseUrl
    }

    func download(url: String, bundleId: String) async throws -> AppResult<NSString> {
        do {
            let documentsDir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            let bundleDir = documentsDir.appendingPathComponent("bundles/\(bundleId)")
            if FileManager.default.fileExists(atPath: bundleDir.path) {
                let contents = try FileManager.default.contentsOfDirectory(atPath: bundleDir.path)
                if !contents.isEmpty {
                    print("[BundleDownloader] Bundle already exists: \(bundleDir.path)")
                    if let root = findWebRoot(in: bundleDir) {
                        return ResultSuccess(data: root.path as NSString)
                    }
                    return ResultSuccess(data: bundleDir.path as NSString)
                }
            }
            var finalUrlString = url
            if !url.starts(with: "http") {
                let normalizedBase = baseUrl.hasSuffix("/") ? baseUrl : "\(baseUrl)/"
                finalUrlString = normalizedBase + url
            }
            print("[BundleDownloader] Downloading from: \(finalUrlString)")
            guard let downloadUrl = URL(string: finalUrlString) else {
                return ResultError<NSString>(error: AppError.UnknownError(message: "Invalid URL: \(finalUrlString)", cause: nil))
            }
            let (zipData, _) = try await URLSession.shared.data(from: downloadUrl)
            let zipFile = FileManager.default.temporaryDirectory.appendingPathComponent("\(bundleId).zip")
            try zipData.write(to: zipFile)
            print("[BundleDownloader] Download complete, unzipping to: \(bundleDir.path)")
            if FileManager.default.fileExists(atPath: bundleDir.path) {
                try FileManager.default.removeItem(at: bundleDir)
            }
            try FileManager.default.createDirectory(at: bundleDir, withIntermediateDirectories: true)
            try FileManager.default.unzipItem(at: zipFile, to: bundleDir)
            try FileManager.default.removeItem(at: zipFile)
            print("[BundleDownloader] Bundle ready: \(bundleDir.path)")
            if let root = findWebRoot(in: bundleDir) {
                return ResultSuccess(data: root.path as NSString)
            } else {
                return ResultSuccess(data: bundleDir.path as NSString)
            }
        } catch {
            print("[BundleDownloader] Failed: \(error.localizedDescription)")
            return ResultError<NSString>(error: AppError.UnknownError(message: error.localizedDescription, cause: nil))
        }
    }

    /// Recursively find the folder containing index.html
    private func findWebRoot(in directory: URL) -> URL? {
        let fileManager = FileManager.default

        // 1. Check current directory
        let indexPath = directory.appendingPathComponent("index.html")
        if fileManager.fileExists(atPath: indexPath.path) {
            return directory
        }

        do {
            let contents = try fileManager.contentsOfDirectory(at: directory, includingPropertiesForKeys: [.isDirectoryKey], options: [.skipsHiddenFiles])
            for url in contents {
                var isDir: ObjCBool = false
                if fileManager.fileExists(atPath: url.path, isDirectory: &isDir), isDir.boolValue {
                    if url.lastPathComponent == "__MACOSX" { continue }
                    if let root = findWebRoot(in: url) {
                        return root
                    }
                }
            }
        } catch {
            print("[BundleDownloader] Error searching for web root: \(error)")
        }

        return nil
    }
}
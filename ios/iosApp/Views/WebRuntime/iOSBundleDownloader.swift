import Foundation
import ZIPFoundation

/// iOS implementation of BundleDownloader conforming to BundleDownloader
class iOSBundleDownloader: NSObject, BundleDownloader {

    private let baseUrl: String

    init(baseUrl: String) {
        self.baseUrl = baseUrl
    }

    func download(url: String, bundleId: String) async -> AppResult<String> {
        do {
            let documentsDir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            let bundleDir = documentsDir.appendingPathComponent("bundles/\(bundleId)")
            if FileManager.default.fileExists(atPath: bundleDir.path) {
                let contents = try FileManager.default.contentsOfDirectory(atPath: bundleDir.path)
                if !contents.isEmpty {
                    if let root = findWebRoot(in: bundleDir) {
                        return .success(root.path)
                    }
                    return .success(bundleDir.path)
                }
            }

            var finalUrlString = url
            if !url.starts(with: "http") {
                let normalizedBase = baseUrl.hasSuffix("/") ? baseUrl : "\(baseUrl)/"
                finalUrlString = normalizedBase + url
            }

            guard let downloadUrl = URL(string: finalUrlString) else {
                return .error(.unknownError(message: "Invalid URL: \(finalUrlString)"))
            }

            let (zipData, _) = try await URLSession.shared.data(from: downloadUrl)
            let zipFile = FileManager.default.temporaryDirectory.appendingPathComponent("\(bundleId).zip")
            try zipData.write(to: zipFile)

            if FileManager.default.fileExists(atPath: bundleDir.path) {
                try FileManager.default.removeItem(at: bundleDir)
            }
            try FileManager.default.createDirectory(at: bundleDir, withIntermediateDirectories: true)
            try FileManager.default.unzipItem(at: zipFile, to: bundleDir)
            try FileManager.default.removeItem(at: zipFile)

            if let root = findWebRoot(in: bundleDir) {
                return .success(root.path)
            }
            return .success(bundleDir.path)
        } catch {
            return .error(.unknownError(message: error.localizedDescription, cause: error))
        }
    }

    private func findWebRoot(in directory: URL) -> URL? {
        let fileManager = FileManager.default
        let indexPath = directory.appendingPathComponent("index.html")
        if fileManager.fileExists(atPath: indexPath.path) {
            return directory
        }

        do {
            let contents = try fileManager.contentsOfDirectory(
                at: directory,
                includingPropertiesForKeys: [.isDirectoryKey],
                options: [.skipsHiddenFiles]
            )
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
            return nil
        }

        return nil
    }
}

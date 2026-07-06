import UIKit

/// Small, fail-safe cache for runtime tab thumbnails.
final class TabSnapshotManager {
    static let shared = TabSnapshotManager()

    private let fileManager: FileManager
    private let directoryURL: URL
    private let ioQueue = DispatchQueue(label: "com.lepos.runtime.tab-snapshots", qos: .utility)
    private let memoryCache = NSCache<NSString, UIImage>()

    private init(fileManager: FileManager = .default) {
        self.fileManager = fileManager
        self.directoryURL = fileManager
            .urls(for: .cachesDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("snapshots", isDirectory: true)
        memoryCache.countLimit = 8
        createDirectoryIfNeeded()
    }

    func snapshotPath(for tabId: UUID) -> String? {
        existingFileURL(for: tabId)?.path
    }

    func saveSnapshot(_ image: UIImage, for tabId: UUID) {
        let key = cacheKey(for: tabId)
        memoryCache.setObject(image, forKey: key)

        ioQueue.async { [weak self] in
            guard let self else { return }
            self.createDirectoryIfNeeded()
            guard let data = image.jpegData(compressionQuality: 0.72) else { return }
            do {
                try data.write(to: self.fileURL(for: tabId), options: .atomic)
            } catch {
                #if DEBUG
                print("[TabSnapshotManager] save failed: \(error.localizedDescription)")
                #endif
            }
        }
    }

    func loadSnapshot(for tabId: UUID) -> UIImage? {
        let key = cacheKey(for: tabId)
        if let image = memoryCache.object(forKey: key) {
            return image
        }

        guard let fileURL = existingFileURL(for: tabId),
              let data = try? Data(contentsOf: fileURL),
              let image = UIImage(data: data) else {
            return nil
        }

        memoryCache.setObject(image, forKey: key)
        return image
    }

    func deleteSnapshot(for tabId: UUID) {
        memoryCache.removeObject(forKey: cacheKey(for: tabId))
        ioQueue.async { [weak self] in
            guard let self else { return }
            self.removeIfExists(self.fileURL(for: tabId))
            self.removeLegacyFiles(for: tabId)
        }
    }

    func clearOrphanedSnapshots(keepTabIds: [UUID]) {
        let keepNames = Set(keepTabIds.map { "\($0.uuidString.lowercased()).jpg" })
        ioQueue.async { [weak self] in
            guard let self else { return }
            for file in self.snapshotFiles() {
                if !keepNames.contains(file.lastPathComponent.lowercased()) {
                    self.removeIfExists(file)
                }
            }
        }
    }

    func totalSnapshotBytes() -> Int64 {
        ioQueue.sync {
            totalSnapshotBytesUnlocked()
        }
    }

    func cleanupIfNeeded(maxBytes: Int64) {
        ioQueue.async { [weak self] in
            guard let self else { return }
            var files = self.snapshotFiles(with: [.fileSizeKey, .contentModificationDateKey])
            var total = self.totalSnapshotBytesUnlocked(files: files)
            guard total > maxBytes else { return }

            files.sort { lhs, rhs in
                let lhsDate = (try? lhs.resourceValues(forKeys: [.contentModificationDateKey]).contentModificationDate) ?? .distantPast
                let rhsDate = (try? rhs.resourceValues(forKeys: [.contentModificationDateKey]).contentModificationDate) ?? .distantPast
                return lhsDate < rhsDate
            }

            for file in files where total > maxBytes {
                let size = Int64((try? file.resourceValues(forKeys: [.fileSizeKey]).fileSize) ?? 0)
                self.removeIfExists(file)
                total -= size
            }
        }
    }

    func clearAll() {
        memoryCache.removeAllObjects()
        ioQueue.async { [weak self] in
            guard let self else { return }
            self.removeIfExists(self.directoryURL)
            self.createDirectoryIfNeeded()
        }
    }

    private func cacheKey(for tabId: UUID) -> NSString {
        tabId.uuidString as NSString
    }

    private func fileURL(for tabId: UUID) -> URL {
        directoryURL.appendingPathComponent("\(tabId.uuidString).jpg", isDirectory: false)
    }

    private func existingFileURL(for tabId: UUID) -> URL? {
        let primary = fileURL(for: tabId)
        if fileManager.fileExists(atPath: primary.path) {
            return primary
        }

        for ext in ["jpeg", "png"] {
            let legacy = directoryURL.appendingPathComponent("\(tabId.uuidString).\(ext)", isDirectory: false)
            if fileManager.fileExists(atPath: legacy.path) {
                return legacy
            }
        }
        return nil
    }

    private func removeLegacyFiles(for tabId: UUID) {
        for ext in ["jpeg", "png"] {
            let file = directoryURL.appendingPathComponent("\(tabId.uuidString).\(ext)", isDirectory: false)
            removeIfExists(file)
        }
    }

    private func createDirectoryIfNeeded() {
        guard !fileManager.fileExists(atPath: directoryURL.path) else { return }
        try? fileManager.createDirectory(at: directoryURL, withIntermediateDirectories: true)
    }

    private func snapshotFiles(with keys: Set<URLResourceKey> = []) -> [URL] {
        createDirectoryIfNeeded()
        return (try? fileManager.contentsOfDirectory(
            at: directoryURL,
            includingPropertiesForKeys: Array(keys),
            options: [.skipsHiddenFiles]
        )) ?? []
    }

    private func totalSnapshotBytesUnlocked(files: [URL]? = nil) -> Int64 {
        (files ?? snapshotFiles(with: [.fileSizeKey])).reduce(Int64(0)) { total, file in
            let size = (try? file.resourceValues(forKeys: [.fileSizeKey]).fileSize) ?? 0
            return total + Int64(size)
        }
    }

    private func removeIfExists(_ url: URL) {
        guard fileManager.fileExists(atPath: url.path) else { return }
        try? fileManager.removeItem(at: url)
    }
}

import UIKit

/// Disk-cache snapshot manager for tabs.
/// Writes snapshots to disk asynchronously to keep RAM usage low.
final class TabSnapshotManager {
    static let shared = TabSnapshotManager()
    
    private let fileManager = FileManager.default
    private let queue = DispatchQueue(label: "com.antigravity.tabsnapshotmanager", qos: .background)
    
    private init() {
        createSnapshotDirectoryIfNeeded()
    }
    
    private func getSnapshotDirectoryURL() -> URL {
        let cacheURL = fileManager.urls(for: .cachesDirectory, in: .userDomainMask)[0]
        return cacheURL.appendingPathComponent("snapshots", isDirectory: true)
    }
    
    private func createSnapshotDirectoryIfNeeded() {
        let dir = getSnapshotDirectoryURL()
        if !fileManager.fileExists(atPath: dir.path) {
            try? fileManager.createDirectory(at: dir, withIntermediateDirectories: true, attributes: nil)
        }
    }
    
    private func getFileURL(for tabId: UUID) -> URL {
        return getSnapshotDirectoryURL().appendingPathComponent("\(tabId.uuidString).jpg")
    }
    
    func saveSnapshot(_ image: UIImage, for tabId: UUID) {
        queue.async { [weak self] in
            guard let self = self else { return }
            let fileURL = self.getFileURL(for: tabId)
            // Compress image to JPEG
            if let data = image.jpegData(compressionQuality: 0.8) {
                do {
                    try data.write(to: fileURL, options: .atomic)
                    print("[TabSnapshotManager] Saved snapshot to disk for: \(tabId.uuidString)")
                } catch {
                    print("[TabSnapshotManager] Failed to write snapshot: \(error.localizedDescription)")
                }
            }
        }
    }
    
    func loadSnapshot(for tabId: UUID) -> UIImage? {
        let fileURL = getFileURL(for: tabId)
        guard fileManager.fileExists(atPath: fileURL.path) else { return nil }
        return UIImage(contentsOfFile: fileURL.path)
    }
    
    func deleteSnapshot(for tabId: UUID) {
        queue.async { [weak self] in
            guard let self = self else { return }
            let fileURL = self.getFileURL(for: tabId)
            if self.fileManager.fileExists(atPath: fileURL.path) {
                try? self.fileManager.removeItem(at: fileURL)
                print("[TabSnapshotManager] Deleted snapshot from disk for: \(tabId.uuidString)")
            }
        }
    }
    
    func clearOrphanedSnapshots(keepTabIds: [UUID]) {
        queue.async { [weak self] in
            guard let self = self else { return }
            let dir = self.getSnapshotDirectoryURL()
            guard let files = try? self.fileManager.contentsOfDirectory(at: dir, includingPropertiesForKeys: nil) else { return }
            
            let keepNames = keepTabIds.map { "\($0.uuidString.lowercased()).png" }
            for file in files {
                let filename = file.lastPathComponent.lowercased()
                if !keepNames.contains(filename) {
                    try? self.fileManager.removeItem(at: file)
                    print("[TabSnapshotManager] Pruned orphaned snapshot: \(filename)")
                }
            }
        }
    }

    func clearAll() {
        queue.async { [weak self] in
            guard let self = self else { return }
            let dir = self.getSnapshotDirectoryURL()
            try? self.fileManager.removeItem(at: dir)
            self.createSnapshotDirectoryIfNeeded()
        }
    }
}

import Foundation

public final class BrowserPersistenceStore: ObservableObject {
    @Published public private(set) var history: [BrowserHistoryItem] = []
    @Published public private(set) var bookmarks: [BrowserBookmark] = []
    
    private let fileManager = FileManager.default
    
    private var applicationSupportDirectory: URL {
        let paths = fileManager.urls(for: .applicationSupportDirectory, in: .userDomainMask)
        let dir = paths[0].appendingPathComponent("Browser", isDirectory: true)
        if !fileManager.fileExists(atPath: dir.path) {
            try? fileManager.createDirectory(at: dir, withIntermediateDirectories: true, attributes: nil)
        }
        return dir
    }
    
    private var historyFileURL: URL {
        applicationSupportDirectory.appendingPathComponent("browser_history.json")
    }
    
    private var bookmarksFileURL: URL {
        applicationSupportDirectory.appendingPathComponent("browser_bookmarks.json")
    }
    
    public init() {
        loadHistory()
        loadBookmarks()
    }
    
    // MARK: - History
    
    public func addHistoryItem(url: String, title: String, isPrivate: Bool) {
        guard !isPrivate else { return }
        
        let normalizedUrl = url.trimmingCharacters(in: .whitespacesAndNewlines)
        if normalizedUrl.isEmpty { return }
        
        // Deduplicate: If the last item is the same URL, remove it or don't add
        if let last = history.first, last.url == normalizedUrl {
            // Update timestamp
            history.removeFirst()
        }
        
        let newItem = BrowserHistoryItem(url: normalizedUrl, title: title)
        history.insert(newItem, at: 0)
        
        // Limit history to 1000 items
        if history.count > 1000 {
            history = Array(history.prefix(1000))
        }
        
        saveHistory()
    }
    
    public func clearHistory() {
        history.removeAll()
        saveHistory()
    }
    
    private func loadHistory() {
        guard fileManager.fileExists(atPath: historyFileURL.path) else { return }
        do {
            let data = try Data(contentsOf: historyFileURL)
            history = try JSONDecoder().decode([BrowserHistoryItem].self, from: data)
        } catch {
            print("[BrowserStore] Error loading history: \(error)")
        }
    }
    
    private func saveHistory() {
        do {
            let data = try JSONEncoder().encode(history)
            try data.write(to: historyFileURL, options: .atomic)
        } catch {
            print("[BrowserStore] Error saving history: \(error)")
        }
    }
    
    // MARK: - Bookmarks
    
    public func addBookmark(url: String, title: String) {
        let normalizedUrl = url.trimmingCharacters(in: .whitespacesAndNewlines)
        if normalizedUrl.isEmpty { return }
        
        // Prevent duplicates
        if bookmarks.contains(where: { $0.url == normalizedUrl }) {
            return
        }
        
        let bookmark = BrowserBookmark(url: normalizedUrl, title: title)
        bookmarks.append(bookmark)
        saveBookmarks()
    }
    
    public func removeBookmark(id: UUID) {
        bookmarks.removeAll(where: { $0.id == id })
        saveBookmarks()
    }
    
    public func clearBookmarks() {
        bookmarks.removeAll()
        saveBookmarks()
    }
    
    private func loadBookmarks() {
        guard fileManager.fileExists(atPath: bookmarksFileURL.path) else { return }
        do {
            let data = try Data(contentsOf: bookmarksFileURL)
            bookmarks = try JSONDecoder().decode([BrowserBookmark].self, from: data)
        } catch {
            print("[BrowserStore] Error loading bookmarks: \(error)")
        }
    }
    
    private func saveBookmarks() {
        do {
            let data = try JSONEncoder().encode(bookmarks)
            try data.write(to: bookmarksFileURL, options: .atomic)
        } catch {
            print("[BrowserStore] Error saving bookmarks: \(error)")
        }
    }
}

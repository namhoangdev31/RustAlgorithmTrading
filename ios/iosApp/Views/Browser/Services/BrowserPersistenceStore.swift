import Foundation

public final class BrowserPersistenceStore: ObservableObject {
    @Published public private(set) var history: [BrowserHistoryItem] = []
    @Published public private(set) var bookmarks: [BrowserBookmark] = []
    @Published public private(set) var readingList: [BrowserReadingListItem] = []
    @Published public private(set) var searchQueries: [String] = []
    @Published public private(set) var favorites: [BrowserFavorite] = []
    
    private let fileManager = FileManager.default
    private let customStorageDirectory: URL?
    
    private var applicationSupportDirectory: URL {
        if let custom = customStorageDirectory {
            if !fileManager.fileExists(atPath: custom.path) {
                try? fileManager.createDirectory(at: custom, withIntermediateDirectories: true, attributes: nil)
            }
            return custom
        }
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
    
    private var readingListFileURL: URL {
        applicationSupportDirectory.appendingPathComponent("browser_reading_list.json")
    }
    
    private var searchQueriesFileURL: URL {
        applicationSupportDirectory.appendingPathComponent("browser_search_queries.json")
    }
    
    private var favoritesFileURL: URL {
        applicationSupportDirectory.appendingPathComponent("browser_favorites.json")
    }
    
    public init(storageDirectory: URL? = nil) {
        self.customStorageDirectory = storageDirectory
        loadHistory()
        loadBookmarks()
        loadReadingList()
        loadSearchQueries()
        loadFavorites()
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
        
        // Auto-extract Google search queries
        if let nsUrl = URL(string: normalizedUrl),
           let components = URLComponents(url: nsUrl, resolvingAgainstBaseURL: false),
           components.host?.contains("google") == true,
           let queryItem = components.queryItems?.first(where: { $0.name == "q" }),
           let query = queryItem.value?.replacingOccurrences(of: "+", with: " ").trimmingCharacters(in: .whitespacesAndNewlines),
           !query.isEmpty {
            addSearchQuery(query)
        }
    }
    
    public func clearHistory() {
        history.removeAll()
        saveHistory()
    }

    public func removeHistoryItem(id: UUID) {
        history.removeAll(where: { $0.id == id })
        saveHistory()
    }
    
    /// Vừa Xem: up to 8 most recent history items, unique by domain
    public var recentlyViewed: [BrowserHistoryItem] {
        var seenDomains = Set<String>()
        var result: [BrowserHistoryItem] = []
        for item in history {
            guard let host = URL(string: item.url)?.host else { continue }
            if seenDomains.insert(host).inserted {
                result.append(item)
            }
            if result.count >= 8 { break }
        }
        return result
    }
    
    /// Thường Xuyên: top 8 domains sorted by visit count
    public var frequentlyVisited: [FrequentSite] {
        var domainCounts: [String: (count: Int, title: String, url: String)] = [:]
        for item in history {
            guard let host = URL(string: item.url)?.host else { continue }
            if let existing = domainCounts[host] {
                domainCounts[host] = (existing.count + 1, existing.title, existing.url)
            } else {
                domainCounts[host] = (1, item.title, item.url)
            }
        }
        return domainCounts
            .sorted { $0.value.count > $1.value.count }
            .prefix(8)
            .map { FrequentSite(domain: $0.key, title: $0.value.title, url: $0.value.url, visitCount: $0.value.count) }
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
    
    // MARK: - Reading List
    
    public func addReadingListItem(url: String, title: String) {
        let normalizedUrl = url.trimmingCharacters(in: .whitespacesAndNewlines)
        if normalizedUrl.isEmpty { return }
        
        // Prevent duplicates
        if readingList.contains(where: { $0.url == normalizedUrl }) {
            return
        }
        
        let domain = URL(string: normalizedUrl)?.host ?? ""
        let preview = "Trang web này có thể chứa thông tin về \(title). Nhấn để xem chi tiết."
        
        let newItem = BrowserReadingListItem(url: normalizedUrl, title: title, domain: domain, previewText: preview)
        readingList.append(newItem)
        saveReadingList()
    }
    
    public func removeReadingListItem(id: UUID) {
        readingList.removeAll(where: { $0.id == id })
        saveReadingList()
    }
    
    public func clearReadingList() {
        readingList.removeAll()
        saveReadingList()
    }
    
    private func loadReadingList() {
        guard fileManager.fileExists(atPath: readingListFileURL.path) else { return }
        do {
            let data = try Data(contentsOf: readingListFileURL)
            readingList = try JSONDecoder().decode([BrowserReadingListItem].self, from: data)
        } catch {
            print("[BrowserStore] Error loading reading list: \(error)")
        }
    }
    
    private func saveReadingList() {
        do {
            let data = try JSONEncoder().encode(readingList)
            try data.write(to: readingListFileURL, options: .atomic)
        } catch {
            print("[BrowserStore] Error saving reading list: \(error)")
        }
    }
    
    // MARK: - Search Queries
    
    public func addSearchQuery(_ query: String) {
        let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty { return }
        
        // Remove duplicate to bring it to top
        searchQueries.removeAll(where: { $0.lowercased() == trimmed.lowercased() })
        searchQueries.insert(trimmed, at: 0)
        
        if searchQueries.count > 100 {
            searchQueries = Array(searchQueries.prefix(100))
        }
        saveSearchQueries()
    }
    
    public func clearSearchQueries() {
        searchQueries.removeAll()
        saveSearchQueries()
    }
    
    private func loadSearchQueries() {
        guard fileManager.fileExists(atPath: searchQueriesFileURL.path) else { return }
        do {
            let data = try Data(contentsOf: searchQueriesFileURL)
            searchQueries = try JSONDecoder().decode([String].self, from: data)
        } catch {
            print("[BrowserStore] Error loading search queries: \(error)")
        }
    }
    
    private func saveSearchQueries() {
        do {
            let data = try JSONEncoder().encode(searchQueries)
            try data.write(to: searchQueriesFileURL, options: .atomic)
        } catch {
            print("[BrowserStore] Error saving search queries: \(error)")
        }
    }
    
    // MARK: - Favorites
    
    public func addFavorite(title: String, url: String) {
        let normalizedTitle = title.trimmingCharacters(in: .whitespacesAndNewlines)
        let normalizedUrl = url.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !normalizedUrl.isEmpty else { return }
        
        let newItem = BrowserFavorite(title: normalizedTitle.isEmpty ? normalizedUrl : normalizedTitle, url: normalizedUrl)
        favorites.append(newItem)
        saveFavorites()
    }
    
    public func deleteFavorite(id: UUID) {
        favorites.removeAll(where: { $0.id == id })
        saveFavorites()
    }
    
    public func updateFavorite(id: UUID, title: String, url: String) {
        guard let index = favorites.firstIndex(where: { $0.id == id }) else { return }
        let normalizedTitle = title.trimmingCharacters(in: .whitespacesAndNewlines)
        let normalizedUrl = url.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !normalizedUrl.isEmpty else { return }
        
        favorites[index].title = normalizedTitle.isEmpty ? normalizedUrl : normalizedTitle
        favorites[index].url = normalizedUrl
        saveFavorites()
    }
    
    private func loadFavorites() {
        if !fileManager.fileExists(atPath: favoritesFileURL.path) {
            // Load default favorites
            self.favorites = [
                BrowserFavorite(title: "Apple", url: "https://apple.com"),
                BrowserFavorite(title: "Bing", url: "https://bing.com"),
                BrowserFavorite(title: "Google", url: "https://google.com"),
                BrowserFavorite(title: "Yahoo!", url: "https://yahoo.com")
            ]
            saveFavorites()
            return
        }
        
        do {
            let data = try Data(contentsOf: favoritesFileURL)
            favorites = try JSONDecoder().decode([BrowserFavorite].self, from: data)
        } catch {
            print("[BrowserStore] Error loading favorites: \(error)")
        }
    }
    
    private func saveFavorites() {
        do {
            let data = try JSONEncoder().encode(favorites)
            try data.write(to: favoritesFileURL, options: .atomic)
        } catch {
            print("[BrowserStore] Error saving favorites: \(error)")
        }
    }
}

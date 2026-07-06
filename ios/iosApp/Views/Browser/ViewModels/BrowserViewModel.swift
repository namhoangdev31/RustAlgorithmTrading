import Foundation
import Combine
import SwiftUI

@MainActor
public final class BrowserViewModel: ObservableObject {
    @Published public var tabs: [BrowserTabViewModel] = []
    @Published public var activeTabId: UUID = UUID()
    @Published public var urlInputText: String = ""
    @Published public var isPrivateMode: Bool = false
    @Published public var showTabSwitcher: Bool = false
    @Published public var showBookmarksList: Bool = false
    @Published public var showHistoryList: Bool = false
    @Published public var isToolbarCollapsed: Bool = false
    @Published public var showSearchOverlay: Bool = false
    @Published public var googleSuggestions: [String] = []
    
    // Dependencies
    public let persistenceStore: BrowserPersistenceStore
    private let websiteDataManager = BrowserWebsiteDataManager()
    private let urlNormalizer = BrowserURLNormalizer()
    
    private var observers: Set<AnyCancellable> = []
    
    public var activeTab: BrowserTabViewModel? {
        tabs.first(where: { $0.id == activeTabId })
    }
    
    public init(
        initialURL: String? = nil,
        isPrivate: Bool = false,
        persistenceStore: BrowserPersistenceStore = BrowserPersistenceStore()
    ) {
        self.persistenceStore = persistenceStore
        self.isPrivateMode = isPrivate
        
        let startURL = initialURL.flatMap { urlNormalizer.normalize($0) }
        createNewTab(initialURL: startURL, isPrivate: isPrivate)
        
        setupActiveTabUrlObserver()
    }
    
    public func createNewTab(initialURL: URL? = nil, isPrivate: Bool, showSearch: Bool = false) {
        self.isPrivateMode = isPrivate
        let newTab = BrowserTabViewModel(initialURL: initialURL, isPrivate: isPrivate)
        configureTabCallbacks(newTab)
        
        tabs.append(newTab)
        activeTabId = newTab.id
        
        if let url = initialURL {
            urlInputText = url.absoluteString
        } else {
            urlInputText = ""
        }
        
        if showSearch {
            showSearchOverlay = true
        }
    }
    
    public func closeTab(id: UUID) {
        guard let index = tabs.firstIndex(where: { $0.id == id }) else { return }
        
        tabs.remove(at: index)
        
        // If we closed the active tab, switch to another tab or open a new blank one
        if activeTabId == id {
            if let firstTab = tabs.first {
                activeTabId = firstTab.id
                urlInputText = firstTab.currentURL?.absoluteString ?? ""
            } else {
                createNewTab(initialURL: nil, isPrivate: isPrivateMode)
            }
        }
    }

    public func closeOtherTabs(keepingId id: UUID) {
        let idsToClose = tabs.filter { $0.id != id }.map { $0.id }
        for closeId in idsToClose {
            closeTab(id: closeId)
        }
        switchTab(to: id)
    }

    public func closeAllTabs() {
        closeAllTabs(isPrivate: isPrivateMode)
    }

    public func closeAllTabs(isPrivate: Bool) {
        let idsToClose = tabs.filter { $0.isPrivate == isPrivate }.map { $0.id }
        for id in idsToClose {
            if let index = tabs.firstIndex(where: { $0.id == id }) {
                tabs.remove(at: index)
            }
        }
        
        let remaining = tabs.filter { $0.isPrivate == isPrivate }
        if remaining.isEmpty {
            let newTab = BrowserTabViewModel(initialURL: nil, isPrivate: isPrivate)
            configureTabCallbacks(newTab)
            tabs.append(newTab)
            activeTabId = newTab.id
            urlInputText = ""
        } else {
            if let active = activeTab, !tabs.contains(where: { $0.id == active.id }) {
                if let firstRemaining = remaining.first {
                    switchTab(to: firstRemaining.id)
                }
            }
        }
    }

    public func duplicateTab(_ tab: BrowserTabViewModel) {
        guard let url = tab.currentURL else {
            createNewTab(initialURL: nil, isPrivate: tab.isPrivate)
            return
        }
        createNewTab(initialURL: url, isPrivate: tab.isPrivate)
    }
    
    public func switchTab(to id: UUID) {
        if let active = activeTab {
            active.captureSnapshot()
        }
        guard tabs.contains(where: { $0.id == id }) else { return }
        activeTabId = id
        if let active = activeTab {
            urlInputText = active.currentURL?.absoluteString ?? ""
        }
    }
    
    public func loadURLString(_ input: String, forceNewTab: Bool = false) {
        guard let normalized = urlNormalizer.normalize(input) else { return }
        
        if let active = activeTab, !forceNewTab && active.currentURL == nil {
            active.load(normalized)
        } else {
            createNewTab(initialURL: normalized, isPrivate: isPrivateMode)
        }
    }
    
    public func handleExternalNavigation(initialURL: String?, isPrivate: Bool) {
        self.isPrivateMode = isPrivate
        
        if let initialURLString = initialURL {
            guard let normalized = urlNormalizer.normalize(initialURLString) else { return }
            if let active = activeTab, active.currentURL == nil && active.isPrivate == isPrivate {
                active.load(normalized)
            } else {
                createNewTab(initialURL: normalized, isPrivate: isPrivate, showSearch: false)
            }
        } else {
            if activeTab == nil {
                createNewTab(initialURL: nil, isPrivate: isPrivate, showSearch: false)
            }
        }
    }
    
    public func addCurrentToBookmarks() {
        guard let active = activeTab, let url = active.currentURL else { return }
        persistenceStore.addBookmark(url: url.absoluteString, title: active.title)
    }
    
    public func addCurrentToReadingList() {
        guard let active = activeTab, let url = active.currentURL else { return }
        persistenceStore.addReadingListItem(url: url.absoluteString, title: active.title)
    }
    
    public func clearWebsiteData() {
        websiteDataManager.clearAllWebsiteData {
            print("[BrowserViewModel] Cookies and Cache cleared.")
        }
        persistenceStore.clearHistory()
    }
    
    private func configureTabCallbacks(_ tab: BrowserTabViewModel) {
        tab.onOpenNewTab = { [weak self] url in
            guard let self = self else { return }
            self.createNewTab(initialURL: url, isPrivate: tab.isPrivate)
        }
        
        tab.onOpenExternalURL = { url in
            UIApplication.shared.open(url, options: [:], completionHandler: nil)
        }
        
        tab.onUpdateHistory = { [weak self] url, title in
            guard let self = self else { return }
            self.persistenceStore.addHistoryItem(
                url: url.absoluteString,
                title: title,
                isPrivate: self.isPrivateMode
            )
        }
        
        tab.onScrollDirectionChange = { [weak self] isCollapsed in
            guard let self = self else { return }
            if self.isToolbarCollapsed != isCollapsed {
                withAnimation(.easeInOut(duration: 0.25)) {
                    self.isToolbarCollapsed = isCollapsed
                }
            }
        }
    }
    
    private func setupActiveTabUrlObserver() {
        $activeTabId
            .map { [weak self] id -> AnyPublisher<URL?, Never> in
                guard let self = self,
                      let active = self.tabs.first(where: { $0.id == id }) else {
                    return Just<URL?>(nil).eraseToAnyPublisher()
                }
                return active.$currentURL.eraseToAnyPublisher()
            }
            .switchToLatest()
            .receive(on: DispatchQueue.main)
            .sink { [weak self] url in
                guard let self = self else { return }
                self.urlInputText = url?.absoluteString ?? ""
                self.objectWillChange.send()
            }
            .store(in: &observers)

        
        NotificationCenter.default.publisher(for: UIApplication.willResignActiveNotification)
            .sink { _ in
                // Perform any saving/cleanups if needed
            }
            .store(in: &observers)
    }
    
    public func syncAddressBar() {
        if let active = activeTab {
            urlInputText = active.currentURL?.absoluteString ?? ""
        }
    }
    
    public func reset() {
        for tab in tabs {
            tab.webView.stopLoading()
            tab.webView.navigationDelegate = nil
            tab.webView.uiDelegate = nil
            tab.webView.scrollView.delegate = nil
            if let blankURL = URL(string: "about:blank") {
                tab.webView.load(URLRequest(url: blankURL))
            }
        }
        tabs.removeAll()
        isToolbarCollapsed = false
        createNewTab(initialURL: nil, isPrivate: false)
    }
    
    public func fetchGoogleSuggestions(_ query: String) {
        print("[BrowserViewModel] fetchGoogleSuggestions query: '\(query)'")
        
        let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            DispatchQueue.main.async {
                self.googleSuggestions = []
            }
            return
        }
        
        let lower = trimmed.lowercased()
        if lower.hasPrefix("http://") || lower.hasPrefix("https://") || (lower.contains(".") && !lower.contains(" ")) {
            print("[BrowserViewModel] Skipping suggestions query because it looks like a URL: \(trimmed)")
            DispatchQueue.main.async {
                self.googleSuggestions = []
            }
            return
        }
        
        guard let encoded = trimmed.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
              let url = URL(string: "https://suggestqueries.google.com/complete/search?client=chrome&q=\(encoded)") else {
            print("[BrowserViewModel] Failed to encode url for query: \(query)")
            return
        }
        
        URLSession.shared.dataTask(with: url) { [weak self] data, response, error in
            if let error = error {
                print("[BrowserViewModel] Suggestions network error: \(error.localizedDescription)")
                return
            }
            guard let data = data else {
                print("[BrowserViewModel] No data received for suggestions query")
                return
            }
            
            if let rawString = String(data: data, encoding: .utf8) {
                print("[BrowserViewModel] Suggestions raw response: \(rawString)")
            }
            
            if let json = try? JSONSerialization.jsonObject(with: data) as? [Any],
               json.count > 1,
               let suggestions = json[1] as? [String] {
                print("[BrowserViewModel] Parsed suggestions: \(suggestions)")
                DispatchQueue.main.async {
                    self?.googleSuggestions = suggestions
                }
            } else {
                print("[BrowserViewModel] Failed to parse JSON or suggestions array")
            }
        }.resume()
    }
}

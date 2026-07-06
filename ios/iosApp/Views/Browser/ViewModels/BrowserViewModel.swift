import Foundation
import Combine
import SwiftUI

@MainActor
public final class BrowserViewModel: ObservableObject {
    @Published public var tabs: [BrowserTabViewModel] = []
    @Published public var activeTabId: UUID = UUID()
    @Published public var urlInputText: String = ""
    @Published public var isAddressBarEditing: Bool = false
    @Published public var isPrivateMode: Bool = false
    @Published public var showBookmarksList: Bool = false
    @Published public var showHistoryList: Bool = false
    @Published public var isToolbarCollapsed: Bool = false
    @Published public var googleSuggestions: [String] = []
    @Published public var showPageDetailsMenu: Bool = false
    @Published public var showFindInPage: Bool = false
    @Published public var findInPageQuery: String = ""
    @Published public var findMatchCount: Int = 0
    @Published public var findCurrentIndex: Int = 0
    @Published public var lastPageActionMessage: String?

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

    // MARK: - Tab Management

    public func createNewTab(initialURL: URL? = nil, isPrivate: Bool) {
        self.isPrivateMode = isPrivate
        let newTab = BrowserTabViewModel(initialURL: initialURL, isPrivate: isPrivate)
        configureTabCallbacks(newTab)
        tabs.append(newTab)
        activeTabId = newTab.id
        urlInputText = initialURL?.absoluteString ?? ""
    }

    public func closeTab(id: UUID) {
        guard let index = tabs.firstIndex(where: { $0.id == id }) else { return }
        tabs.remove(at: index)
        if activeTabId == id {
            if let first = tabs.first {
                activeTabId = first.id
                urlInputText = first.currentURL?.absoluteString ?? ""
            } else {
                createNewTab(initialURL: nil, isPrivate: isPrivateMode)
            }
        }
    }

    public func closeOtherTabs(keepingId id: UUID) {
        tabs.filter { $0.id != id }.map { $0.id }.forEach { closeTab(id: $0) }
        switchTab(to: id)
    }

    public func closeAllTabs() { closeAllTabs(isPrivate: isPrivateMode) }

    public func closeAllTabs(isPrivate: Bool) {
        tabs.filter { $0.isPrivate == isPrivate }.map { $0.id }.forEach { id in
            tabs.removeAll { $0.id == id }
        }
        let remaining = tabs.filter { $0.isPrivate == isPrivate }
        if remaining.isEmpty {
            let newTab = BrowserTabViewModel(initialURL: nil, isPrivate: isPrivate)
            configureTabCallbacks(newTab)
            tabs.append(newTab)
            activeTabId = newTab.id
            urlInputText = ""
        } else if let active = activeTab, !tabs.contains(where: { $0.id == active.id }),
                  let first = remaining.first {
            switchTab(to: first.id)
        }
    }

    public func duplicateTab(_ tab: BrowserTabViewModel) {
        createNewTab(initialURL: tab.currentURL, isPrivate: tab.isPrivate)
    }

    public func switchTab(to id: UUID) {
        guard tabs.contains(where: { $0.id == id }) else { return }
        activeTabId = id
        urlInputText = activeTab?.currentURL?.absoluteString ?? ""
    }

    // MARK: - URL Loading

    public func loadURLString(_ input: String, forceNewTab: Bool = false) {
        guard let normalized = urlNormalizer.normalize(input) else { return }
        if let active = activeTab, !forceNewTab {
            active.load(normalized)
            urlInputText = normalized.absoluteString
        } else {
            createNewTab(initialURL: normalized, isPrivate: isPrivateMode)
        }
    }

    public func handleExternalNavigation(initialURL: String?, isPrivate: Bool) {
        self.isPrivateMode = isPrivate
        if let str = initialURL, let normalized = urlNormalizer.normalize(str) {
            if let active = activeTab, active.currentURL == normalized {
                // Already loaded in active tab, do nothing
            } else if let active = activeTab, active.currentURL == nil && active.isPrivate == isPrivate {
                active.load(normalized)
            } else {
                createNewTab(initialURL: normalized, isPrivate: isPrivate)
            }
        } else if activeTab == nil {
            createNewTab(initialURL: nil, isPrivate: isPrivate)
        }
    }

    // MARK: - Bookmarks / History

    public func addCurrentToBookmarks() {
        guard let active = activeTab, let url = active.currentURL else { return }
        persistenceStore.addBookmark(url: url.absoluteString, title: active.title)
        lastPageActionMessage = "Đã thêm vào Dấu trang."
    }

    public func addCurrentToReadingList() {
        guard let active = activeTab, let url = active.currentURL else { return }
        persistenceStore.addReadingListItem(url: url.absoluteString, title: active.title)
        lastPageActionMessage = "Đã thêm vào Danh sách đọc."
    }

    public func clearWebsiteData() {
        websiteDataManager.clearAllWebsiteData {
            print("[BrowserViewModel] Cookies and Cache cleared.")
        }
        persistenceStore.clearHistory()
        persistenceStore.clearSearchQueries()
        lastPageActionMessage = "Đã xóa lịch sử, tìm kiếm và dữ liệu trang web."
    }

    // MARK: - Tab Callbacks

    private func configureTabCallbacks(_ tab: BrowserTabViewModel) {
        tab.onOpenNewTab = { [weak self] url in
            self?.createNewTab(initialURL: url, isPrivate: tab.isPrivate)
        }

        tab.onOpenExternalURL = { [weak self, weak tab] url in
            UIApplication.shared.open(url, options: [:]) { success in
                guard !success, let self, let tab else { return }
                Task { @MainActor in self.handleExternalURLOpenFailure(url, tab: tab) }
            }
        }

        tab.onUpdateHistory = { [weak self] url, title in
            guard let self else { return }
            self.persistenceStore.addHistoryItem(url: url.absoluteString, title: title, isPrivate: tab.isPrivate)
        }

        tab.onScrollDirectionChange = { [weak self] isCollapsed in
            guard let self, self.isToolbarCollapsed != isCollapsed else { return }
            withAnimation(.easeInOut(duration: 0.25)) {
                self.isToolbarCollapsed = isCollapsed
            }
        }
    }

    private func handleExternalURLOpenFailure(_ url: URL, tab: BrowserTabViewModel) {
        // Try extracting an embedded web URL from query params
        if let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
           let queryItems = components.queryItems {
            for param in ["deep_link_id", "link", "url", "redirect"] {
                if let value = queryItems.first(where: { $0.name == param })?.value,
                   let embedded = URL(string: value),
                   embedded.scheme == "http" || embedded.scheme == "https" {
                    tab.load(embedded)
                    return
                }
            }
        }
        // Fallback: itms-apps → https
        if var components = URLComponents(url: url, resolvingAgainstBaseURL: false),
           let scheme = components.scheme?.lowercased(),
           scheme == "itms-apps" || scheme == "itms-appss" {
            components.scheme = "https"
            if let fallback = components.url { tab.load(fallback) }
        }
    }

    // MARK: - Observers

    private func setupActiveTabUrlObserver() {
        $activeTabId
            .map { [weak self] id -> AnyPublisher<URL?, Never> in
                guard let self,
                      let active = self.tabs.first(where: { $0.id == id }) else {
                    return Just<URL?>(nil).eraseToAnyPublisher()
                }
                return active.$currentURL.eraseToAnyPublisher()
            }
            .switchToLatest()
            .receive(on: RunLoop.main)
            .sink { [weak self] url in
                self?.urlInputText = url?.absoluteString ?? ""
            }
            .store(in: &observers)

        NotificationCenter.default.publisher(for: UIApplication.willResignActiveNotification)
            .sink { _ in }
            .store(in: &observers)
    }

    public func syncAddressBar() {
        urlInputText = activeTab?.currentURL?.absoluteString ?? ""
    }

    public func reset() {
        isToolbarCollapsed = false
        isAddressBarEditing = false
        showPageDetailsMenu = false
        showFindInPage = false
        findInPageQuery = ""
        lastPageActionMessage = nil
    }

    public func submitSearch(_ query: String) {
        let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        
        persistenceStore.addSearchQuery(trimmed)
        if let normalized = urlNormalizer.normalize(trimmed), let active = activeTab {
            active.load(normalized)
        }
        isAddressBarEditing = false
    }

    // MARK: - Search Suggestions

    public func fetchGoogleSuggestions(_ query: String) {
        let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { googleSuggestions = []; return }

        let lower = trimmed.lowercased()
        guard !lower.hasPrefix("http://"), !lower.hasPrefix("https://"),
              !(lower.contains(".") && !lower.contains(" ")) else {
            googleSuggestions = []
            return
        }

        guard let encoded = trimmed.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
              let url = URL(string: "https://suggestqueries.google.com/complete/search?client=chrome&q=\(encoded)") else { return }

        Task {
            guard let (data, _) = try? await URLSession.shared.data(from: url),
                  let json = try? JSONSerialization.jsonObject(with: data) as? [Any],
                  json.count > 1,
                  let suggestions = json[1] as? [String] else { return }
            googleSuggestions = suggestions
        }
    }
}

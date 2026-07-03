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
        createNewTab(initialURL: startURL)
        
        setupActiveTabUrlObserver()
    }
    
    public func createNewTab(initialURL: URL? = nil) {
        let newTab = BrowserTabViewModel(initialURL: initialURL, isPrivate: isPrivateMode)
        configureTabCallbacks(newTab)
        
        tabs.append(newTab)
        activeTabId = newTab.id
        
        if let url = initialURL {
            urlInputText = url.absoluteString
        } else {
            urlInputText = ""
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
                createNewTab(initialURL: nil)
            }
        }
    }
    
    public func switchTab(to id: UUID) {
        guard tabs.contains(where: { $0.id == id }) else { return }
        activeTabId = id
        if let active = activeTab {
            urlInputText = active.currentURL?.absoluteString ?? ""
        }
    }
    
    public func loadURLString(_ input: String) {
        guard let normalized = urlNormalizer.normalize(input) else { return }
        
        if let active = activeTab {
            active.load(normalized)
        } else {
            createNewTab(initialURL: normalized)
        }
    }
    
    public func addCurrentToBookmarks() {
        guard let active = activeTab, let url = active.currentURL else { return }
        persistenceStore.addBookmark(url: url.absoluteString, title: active.title)
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
            self.createNewTab(initialURL: url)
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
    }
    
    private func setupActiveTabUrlObserver() {
        // Sync URL text field whenever active tab updates URL
        $activeTabId
            .sink { [weak self] _ in
                self?.syncAddressBar()
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
}

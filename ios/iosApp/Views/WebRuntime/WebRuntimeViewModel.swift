import Foundation
import UIKit
import WebKit
import ExploreSwiftUI

enum WebTabStatus {
    case loading
    case active
    case paused
    case suspended
    case closing
    case closed
}

final class WebTab: ObservableObject, Identifiable {
    let id: UUID
    let manifest: WebRuntimeManifest
    let bundlePath: URL

    @Published var server: iOSWebServer
    @Published var serverURL: URL?
    @Published var webView: RuntimeWebView?

    @Published var lastVisitedURL: URL?
    @Published var status: WebTabStatus

    var title: String { manifest.name }
    var url: URL? { serverURL }
    var cachedSnapshot: UIImage? { snapshot }
    
    var snapshot: UIImage? {
        get {
            TabSnapshotManager.shared.loadSnapshot(for: id)
        }
        set {
            if let img = newValue {
                TabSnapshotManager.shared.saveSnapshot(img, for: id)
            } else {
                TabSnapshotManager.shared.deleteSnapshot(for: id)
            }
            objectWillChange.send()
        }
    }
    
    init(
        id: UUID = UUID(),
        manifest: WebRuntimeManifest,
        bundlePath: URL,
        server: iOSWebServer,
        serverURL: URL? = nil,
        webView: RuntimeWebView? = nil,
        snapshot: UIImage? = nil,
        status: WebTabStatus = .loading
    ) {
        self.id = id
        self.manifest = manifest
        self.bundlePath = bundlePath
        self.server = server
        self.serverURL = serverURL
        self.webView = webView
        self.status = status
        if let img = snapshot {
            TabSnapshotManager.shared.saveSnapshot(img, for: id)
        }
    }
}

extension WebTab: Hashable, Equatable {
    static func == (lhs: WebTab, rhs: WebTab) -> Bool {
        lhs.id == rhs.id
    }
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
}

@MainActor
class WebRuntimeViewModel: ObservableObject {
    @Published var tabs: [WebTab] = []
    @Published var activeTabId: UUID?
    @Published var showTabSwitcher: Bool = false
    @Published var errorMsg: String?
    @Published var lruTabIds: [UUID] = []
    
    init() {
        setupLifecycleObservers()
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self)
    }
    
    // MARK: - Lifecycle Notifications
    private func setupLifecycleObservers() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleMemoryWarning),
            name: UIApplication.didReceiveMemoryWarningNotification,
            object: nil
        )
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleDidEnterBackground),
            name: UIApplication.didEnterBackgroundNotification,
            object: nil
        )
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleWillEnterForeground),
            name: UIApplication.willEnterForegroundNotification,
            object: nil
        )
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleWillTerminate),
            name: UIApplication.willTerminateNotification,
            object: nil
        )
    }
    
    @objc private func handleMemoryWarning() {
        print("[ResourceManager] Low memory! Suspending inactive tabs.")
        for tab in tabs where tab.id != activeTabId {
            suspendTab(tab)
        }
    }
    
    @objc private func handleDidEnterBackground() {
        print("[ResourceManager] App entered background. Pausing active tab and saving state.")
        if let activeId = activeTabId, let activeTab = tabs.first(where: { $0.id == activeId }) {
            pauseTab(activeTab)
        }
        saveTabsState()
    }
    
    @objc private func handleWillEnterForeground() {
        print("[ResourceManager] App will enter foreground. Resuming active tab.")
        if let activeId = activeTabId {
            activateTab(id: activeId)
        }
    }
    
    @objc private func handleWillTerminate() {
        print("[ResourceManager] App will terminate. Cleaning up all servers and saving state.")
        saveTabsState()
        stopAll()
    }
    
    // MARK: - Tab Operations
    
    func openBundle(manifest: WebRuntimeManifest, bundlePath: URL) {
        MiniAppManager.shared.registerLaunch(appId: manifest.id, currentVersion: manifest.version) { [weak self] result in
            guard let self = self else { return }
            DispatchQueue.main.async {
                switch result {
                case .success(let resolvedURL):
                    self.proceedWithOpenBundle(manifest: manifest, bundlePath: resolvedURL)
                case .failure(let error):
                    print("[WebRuntime] Launch registration/rollback failed: \(error.localizedDescription)")
                }
            }
        }
    }
    
    private func proceedWithOpenBundle(manifest: WebRuntimeManifest, bundlePath: URL) {
        // Try to restore previous tabs state first if currently empty
        if tabs.isEmpty {
            if restoreTabsState(manifest: manifest, bundlePath: bundlePath) {
                return
            }
        }

        // 1. If bundle already open, select and activate it
        if let existing = tabs.first(where: { $0.manifest.id == manifest.id }) {
            activateTab(id: existing.id)
            return
        }
        
        // 2. Initialize a new server (starts on random port due to port = 0 default)
        let server = iOSWebServer(basePath: bundlePath.path)
        
        let newTab = WebTab(
            manifest: manifest,
            bundlePath: bundlePath,
            server: server,
            status: .loading
        )
        
        ServerRegistry.shared.register(id: newTab.id, server: server)
        tabs.append(newTab)
        activateTab(id: newTab.id)
        saveTabsState()
    }
    
    func activateTab(id: UUID) {
        guard let selected = tabs.first(where: { $0.id == id }) else { return }
        
        // Pause all other tabs
        for tab in tabs where tab.id != id {
            pauseTab(tab)
        }
        
        do {
            // Resume/start local web server
            let url = try selected.server.resume()
            selected.serverURL = url
            
            // Build webview if nil (e.g. new or suspended)
            if selected.webView == nil {
                selected.webView = makeWebView(for: selected)
            }
            
            // Reconstruct URL preserving path and query for SPAs
            let targetURL: URL
            if let lastVisited = selected.lastVisitedURL {
                var components = URLComponents(url: lastVisited, resolvingAgainstBaseURL: false)
                components?.host = url.host
                components?.port = url.port
                targetURL = components?.url ?? url.appendingPathComponent("index.html")
            } else {
                targetURL = url.appendingPathComponent("index.html")
            }
            
            print("[TabManager] Activating tab: \(selected.manifest.name) at \(targetURL.absoluteString)")
            
            selected.webView?.load(URLRequest(url: targetURL))
            
            selected.status = .active
            activeTabId = id
            updateLRU(id: id)
            saveTabsState()
        } catch {
            print("[TabManager] Error activating tab: \(error.localizedDescription)")
            selected.status = .paused
            errorMsg = error.localizedDescription
        }
    }
    
    func pauseTab(_ tab: WebTab) {
        guard tab.status == .active else { return }
        
        // 1. Capture snapshot asynchronously
        Task {
            if let img = await tab.webView?.takeSnapshot() {
                tab.snapshot = img
            }
        }
        
        // 2. Dispatch runtimepause event to JS
        tab.webView?.evaluateJavaScript("document.dispatchEvent(new Event('runtimepause'))")
        
        // 3. Stop loading and pause server
        tab.webView?.stopLoading()
        tab.server.pause()
        tab.status = .paused
        
        // Save current URL path before pause
        if let currentURL = tab.webView?.url {
            tab.lastVisitedURL = currentURL
        }
    }
    
    func suspendTab(_ tab: WebTab) {
        guard tab.status == .paused else { return }
        tab.webView = nil // destroy webview instance to save memory
        tab.status = .suspended
    }
    
    func closeTab(id: UUID) {
        guard let index = tabs.firstIndex(where: { $0.id == id }) else { return }
        let tab = tabs[index]
        
        tab.status = .closing
        tab.webView?.stopLoading()
        
        // Remove script message handlers to prevent strong reference leaks
        if let webView = tab.webView {
            webView.configuration.userContentController.removeScriptMessageHandler(forName: "wasm")
            webView.configuration.userContentController.removeScriptMessageHandler(forName: "plugin")
        }
        
        ServerRegistry.shared.stop(id: id)
        tab.webView = nil
        
        tabs.remove(at: index)
        saveTabsState()
        
        if activeTabId == id {
            activeTabId = tabs.last?.id
            if let nextId = activeTabId {
                activateTab(id: nextId)
            }
        }
    }
    
    func stopAll() {
        for tab in tabs {
            tab.webView?.stopLoading()
            if let webView = tab.webView {
                webView.configuration.userContentController.removeScriptMessageHandler(forName: "wasm")
                webView.configuration.userContentController.removeScriptMessageHandler(forName: "plugin")
            }
            tab.webView = nil
        }
        ServerRegistry.shared.stopAll()
        tabs.removeAll()
        activeTabId = nil
    }
    
    // MARK: - Persistence & Crash Recovery
    struct TabStateMetadata: Codable {
        let bundleId: String
        let lastVisitedURL: String?
        let status: String
    }
    
    private func getTabsJSONURL() -> URL {
        let paths = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)
        return paths[0].appendingPathComponent("tabs.json")
    }
    
    func saveTabsState() {
        let metadataList = tabs.map { tab in
            TabStateMetadata(
                bundleId: tab.manifest.id,
                lastVisitedURL: tab.lastVisitedURL?.absoluteString,
                status: tab.id == activeTabId ? "active" : "paused"
            )
        }
        do {
            let data = try JSONEncoder().encode(metadataList)
            try data.write(to: getTabsJSONURL())
            print("[TabManager] Saved tabs state successfully.")
        } catch {
            print("[TabManager] Failed to save tabs state: \(error.localizedDescription)")
        }
    }
    
    func restoreTabsState(manifest: WebRuntimeManifest, bundlePath: URL) -> Bool {
        let url = getTabsJSONURL()
        guard FileManager.default.fileExists(atPath: url.path) else { return false }
        
        do {
            let data = try Data(contentsOf: url)
            let metadataList = try JSONDecoder().decode([TabStateMetadata].self, from: data)
            
            // Clean up any existing state first
            stopAll()
            
            for meta in metadataList {
                guard meta.bundleId == manifest.id else { continue }
                
                let server = iOSWebServer(basePath: bundlePath.path)
                let tab = WebTab(
                    manifest: manifest,
                    bundlePath: bundlePath,
                    server: server,
                    status: .paused
                )
                if let lastURLString = meta.lastVisitedURL, let lastURL = URL(string: lastURLString) {
                    tab.lastVisitedURL = lastURL
                }
                
                ServerRegistry.shared.register(id: tab.id, server: server)
                tabs.append(tab)
                
                if meta.status == "active" {
                    activeTabId = tab.id
                }
            }
            
            if let activeId = activeTabId {
                activateTab(id: activeId)
            } else if !tabs.isEmpty {
                activateTab(id: tabs[0].id)
            }
            return !tabs.isEmpty
        } catch {
            print("[TabManager] Failed to restore tabs state: \(error.localizedDescription)")
            return false
        }
    }
    
    private func makeWebView(for tab: WebTab) -> RuntimeWebView {
        let webView = RuntimeWebView(frame: .zero, manifest: tab.manifest, bundlePath: tab.bundlePath)
        return webView
    }
    
    // MARK: - LRU Resource Budget
    private func updateLRU(id: UUID) {
        if let idx = lruTabIds.firstIndex(of: id) {
            lruTabIds.remove(at: idx)
        }
        lruTabIds.append(id)
        enforceResourceBudget()
    }
    
    private func enforceResourceBudget() {
        let maxTabsLimit = 8
        guard tabs.count > maxTabsLimit else { return }
        
        for lruId in lruTabIds {
            if lruId != activeTabId,
               let index = tabs.firstIndex(where: { $0.id == lruId }) {
                let tab = tabs[index]
                if tab.status == .paused {
                    print("[TabManager] Evicting tab due to resource limit (LRU): \(tab.manifest.name)")
                    suspendTab(tab)
                    break
                }
            }
        }
    }
}

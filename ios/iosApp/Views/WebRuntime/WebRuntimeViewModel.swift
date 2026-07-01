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

    @Published var snapshot: UIImage?
    @Published var lastVisitedURL: URL?
    @Published var status: WebTabStatus

    var title: String { manifest.name }
    var url: URL? { serverURL }
    var cachedSnapshot: UIImage? { snapshot }
    
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
        self.snapshot = snapshot
        self.status = status
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
    }
    
    @objc private func handleMemoryWarning() {
        print("[ResourceManager] Low memory! Suspending inactive tabs.")
        for tab in tabs where tab.id != activeTabId {
            suspendTab(tab)
        }
    }
    
    @objc private func handleDidEnterBackground() {
        print("[ResourceManager] App entered background. Pausing active tab.")
        if let activeId = activeTabId, let activeTab = tabs.first(where: { $0.id == activeId }) {
            pauseTab(activeTab)
        }
    }
    
    @objc private func handleWillEnterForeground() {
        print("[ResourceManager] App will enter foreground. Resuming active tab.")
        if let activeId = activeTabId {
            activateTab(id: activeId)
        }
    }
    
    // MARK: - Tab Operations
    
    func openBundle(manifest: WebRuntimeManifest, bundlePath: URL) {
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
        
        tabs.append(newTab)
        activateTab(id: newTab.id)
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
        
        tab.server.stop()
        tab.webView = nil
        
        tabs.remove(at: index)
        
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
            tab.server.stop()
            tab.webView = nil
        }
        tabs.removeAll()
        activeTabId = nil
    }
    
    private func makeWebView(for tab: WebTab) -> RuntimeWebView {
        let webView = RuntimeWebView(frame: .zero, manifest: tab.manifest, bundlePath: tab.bundlePath)
        return webView
    }
}

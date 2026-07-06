import Foundation
import WebKit
import Combine

@MainActor
public final class BrowserTabViewModel: NSObject, ObservableObject, Identifiable {
    public let id: UUID
    public let isPrivate: Bool
    public let webView: WKWebView
    
    @Published public var title: String = "Tab Mới"
    @Published public var currentURL: URL? = nil
    @Published public var pageState: BrowserPageState = .idle
    @Published public var canGoBack: Bool = false
    @Published public var canGoForward: Bool = false
    @Published public var snapshot: UIImage? = nil
    
    // Callbacks to bubble events to the main BrowserViewModel
    public var onOpenNewTab: ((URL) -> Void)?
    public var onOpenExternalURL: ((URL) -> Void)?
    public var onUpdateHistory: ((URL, String) -> Void)?
    public var onScrollDirectionChange: ((Bool) -> Void)?
    
    private var observers: Set<AnyCancellable> = []
    private let navigationPolicy = BrowserNavigationPolicy()
    private var lastScrollY: CGFloat = 0
    
    // Crash recovery tracking
    private var lastCrashTime: Date? = nil
    private var autoReloadCount = 0
    
    public init(id: UUID = UUID(), initialURL: URL? = nil, isPrivate: Bool) {
        self.id = id
        self.isPrivate = isPrivate
        
        let configuration = WKWebViewConfiguration()
        configuration.allowsInlineMediaPlayback = true
        configuration.mediaTypesRequiringUserActionForPlayback = []
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        configuration.websiteDataStore = isPrivate ? .nonPersistent() : .default()
        
        self.webView = WKWebView(frame: .zero, configuration: configuration)
        self.currentURL = initialURL
        
        super.init()
        
        self.webView.navigationDelegate = self
        self.webView.uiDelegate = self
        self.webView.scrollView.delegate = self
        
        setupObservers()
        
        if let url = initialURL {
            load(url)
        }
    }
    
    deinit {
        // Clean up observers and webview delegates safely on MainActor
        let webView = self.webView
        DispatchQueue.main.async {
            webView.navigationDelegate = nil
            webView.uiDelegate = nil
            webView.scrollView.delegate = nil
            webView.stopLoading()
            if let blankURL = URL(string: "about:blank") {
                webView.load(URLRequest(url: blankURL))
            }
        }
    }
    
    private func setupObservers() {
        // Observe KVO properties on WKWebView
        webView.publisher(for: \.title)
            .compactMap { $0 }
            .receive(on: DispatchQueue.main)
            .assign(to: \.title, on: self)
            .store(in: &observers)
        
        webView.publisher(for: \.url)
            .receive(on: DispatchQueue.main)
            .assign(to: \.currentURL, on: self)
            .store(in: &observers)
        
        webView.publisher(for: \.canGoBack)
            .receive(on: DispatchQueue.main)
            .assign(to: \.canGoBack, on: self)
            .store(in: &observers)
        
        webView.publisher(for: \.canGoForward)
            .receive(on: DispatchQueue.main)
            .assign(to: \.canGoForward, on: self)
            .store(in: &observers)
        
        webView.publisher(for: \.estimatedProgress)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] progress in
                guard let self = self else { return }
                if self.webView.isLoading {
                    self.pageState = .loading(progress: progress)
                } else if progress >= 1.0 {
                    self.pageState = .loaded
                }
            }
            .store(in: &observers)
    }
    
    // MARK: - Navigation Actions
    
    public func load(_ url: URL) {
        let redacted = BrowserURLNormalizer.redactURLForLogging(url)
        print("[BrowserTabViewModel] Loading: \(redacted)")
        
        let decision = navigationPolicy.decidePolicy(for: url, isMainFrame: true)
        switch decision {
        case .allow:
            let request = URLRequest(url: url)
            webView.load(request)
        case .cancel:
            break
        case .openExternal(let externalUrl):
            onOpenExternalURL?(externalUrl)
        case .openNewTab(let newTabUrl):
            onOpenNewTab?(newTabUrl)
        case .blocked(let reason):
            self.pageState = .failed(.securityBlocked(reason: reason.rawValue))
        }
    }
    
    public func goBack() {
        if webView.canGoBack {
            webView.goBack()
        }
    }
    
    public func goForward() {
        if webView.canGoForward {
            webView.goForward()
        }
    }
    
    public func reload() {
        webView.reload()
    }
    
    public func stopLoading() {
        webView.stopLoading()
        self.pageState = .loaded
    }
    
    public func captureSnapshot() {
        guard webView.bounds.width > 0 && webView.bounds.height > 0 else { return }
        let config = WKSnapshotConfiguration()
        webView.takeSnapshot(with: config) { [weak self] image, error in
            guard let self = self, let image = image else { return }
            DispatchQueue.main.async {
                self.snapshot = image
            }
        }
    }
}

// MARK: - WKNavigationDelegate
extension BrowserTabViewModel: WKNavigationDelegate {
    public func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        self.pageState = .loading(progress: 0.0)
    }
    
    public func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        self.pageState = .loaded
        if let url = webView.url {
            let titleStr = webView.title ?? url.host ?? "Website"
            onUpdateHistory?(url, titleStr)
        }
        
        // Capture snapshot after 0.5s to let the layout settle
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
            self?.captureSnapshot()
        }
    }
    
    public func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        self.pageState = .failed(.navigationFailed(error.localizedDescription))
    }
    
    public func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        self.pageState = .failed(.navigationFailed(error.localizedDescription))
    }
    
    public func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else {
            decisionHandler(.cancel)
            return
        }
        
        let isMainFrame = navigationAction.targetFrame?.isMainFrame ?? false
        let decision = navigationPolicy.decidePolicy(for: url, isMainFrame: isMainFrame)
        
        switch decision {
        case .allow:
            decisionHandler(.allow)
        case .cancel:
            decisionHandler(.cancel)
        case .openExternal(let externalUrl):
            decisionHandler(.cancel)
            onOpenExternalURL?(externalUrl)
        case .openNewTab(let newTabUrl):
            decisionHandler(.cancel)
            onOpenNewTab?(newTabUrl)
        case .blocked(let reason):
            decisionHandler(.cancel)
            self.pageState = .failed(.securityBlocked(reason: reason.rawValue))
        }
    }
    
    public func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        let now = Date()
        if let lastCrash = lastCrashTime, now.timeIntervalSince(lastCrash) < 30 {
            autoReloadCount += 1
        } else {
            autoReloadCount = 1
        }
        lastCrashTime = now
        
        if autoReloadCount <= 1 {
            print("[BrowserTabViewModel] Web content process terminated. Auto-reloading...")
            webView.reload()
        } else {
            print("[BrowserTabViewModel] Web content process crashed repeatedly. Halting.")
            self.pageState = .failed(.webProcessCrashed)
        }
    }
}

// MARK: - WKUIDelegate
extension BrowserTabViewModel: WKUIDelegate {
    public func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = navigationAction.request.url {
            onOpenNewTab?(url)
        } else if navigationAction.targetFrame == nil {
            // Case where website initiates window.open() without URL immediately
            // We just let the main view model handle it when navigation starts
        }
        return nil
    }
    
    // Alert dialogs
    public func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        // Fallback to simple completion to avoid freezing webview
        completionHandler()
    }
    
    public func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        completionHandler(false)
    }
    
    public func webView(_ webView: WKWebView, runJavaScriptTextInputPanelWithPrompt prompt: String, defaultText: String?, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (String?) -> Void) {
        completionHandler(nil)
    }
}

// MARK: - UIScrollViewDelegate
extension BrowserTabViewModel: UIScrollViewDelegate {
    public func scrollViewDidScroll(_ scrollView: UIScrollView) {
        let currentY = scrollView.contentOffset.y
        let delta = currentY - lastScrollY
        
        // Avoid collapsing during rubber-banding/bouncing at top
        if currentY > 0 && scrollView.contentSize.height > scrollView.frame.size.height {
            if delta > 12 {
                // Scroll down -> collapse
                onScrollDirectionChange?(true)
            } else if delta < -12 {
                // Scroll up -> expand
                onScrollDirectionChange?(false)
            }
        } else if currentY <= 0 {
            // Force expand when at the top
            onScrollDirectionChange?(false)
        }
        
        lastScrollY = currentY
    }
}

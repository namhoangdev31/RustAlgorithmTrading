import Combine
import Foundation
import UIKit
import WebKit

@MainActor
public final class BrowserTabViewModel: NSObject, ObservableObject, Identifiable {
    public let id: UUID
    public let isPrivate: Bool
    public let webView: WKWebView

    @Published public var title = "Tab Mới"
    @Published public var currentURL: URL?
    @Published public var pageState: BrowserPageState = .idle
    @Published public var canGoBack = false
    @Published public var canGoForward = false
    @Published public var snapshot: UIImage?
    @Published public var textZoomLevel = 100
    @Published public var isDesktopSite = false

    public var onOpenNewTab: ((URL) -> Void)?
    public var onOpenExternalURL: ((URL) -> Void)?
    public var onUpdateHistory: ((URL, String) -> Void)?
    public var onScrollDirectionChange: ((Bool) -> Void)?

    private var observers: Set<AnyCancellable> = []
    private let navigationPolicy = BrowserNavigationPolicy()
    private var lastScrollY: CGFloat = 0
    private var isCapturingSnapshot = false
    private var pendingSnapshotTask: Task<Void, Never>?
    private var crashReloadTask: Task<Void, Never>?
    private var lastCrashTime: Date?
    private var lastCrashURL: URL?
    private var crashCount = 0

    private static let crashWindowSeconds: TimeInterval = 60
    private static let maxAutoReloads = 2

    public init(id: UUID = UUID(), initialURL: URL? = nil, isPrivate: Bool) {
        self.id = id
        self.isPrivate = isPrivate

        let configuration = WKWebViewConfiguration()
        configuration.allowsInlineMediaPlayback = true
        configuration.mediaTypesRequiringUserActionForPlayback = []
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        configuration.websiteDataStore = isPrivate ? .nonPersistent() : .default()

        if isPrivate {
            let isProxyEnabled = UserDefaults.standard.bool(forKey: "browser_proxy_enabled")
            if isProxyEnabled,
               let savedData = UserDefaults.standard.data(forKey: "browser_proxy_config"),
               let config = try? JSONDecoder().decode(BrowserProxyConfig.self, from: savedData) {
                if #available(iOS 17.0, *) {
                    configuration.websiteDataStore.proxyConfigurations = [config.toProxyConfiguration()]
                }
            }
        }

        self.webView = WKWebView(frame: .zero, configuration: configuration)
        self.currentURL = initialURL

        super.init()

        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.scrollView.delegate = self
        setupObservers()

        if let initialURL {
            load(initialURL)
        }
    }

    deinit {
        pendingSnapshotTask?.cancel()
        crashReloadTask?.cancel()
        let webView = webView
        Task { @MainActor in
            webView.stopLoading()
            webView.navigationDelegate = nil
            webView.uiDelegate = nil
            webView.scrollView.delegate = nil
        }
    }

    public func load(_ url: URL) {
        let decision = navigationPolicy.decidePolicy(for: url, isMainFrame: true)
        switch decision {
        case .allow:
            currentURL = url
            pageState = .loading(progress: 0)
            webView.load(URLRequest(url: url))
        case .cancel:
            break
        case .openExternal(let externalURL):
            onOpenExternalURL?(externalURL)
        case .openNewTab(let newTabURL):
            onOpenNewTab?(newTabURL)
        case .blocked(let reason):
            pageState = .failed(.securityBlocked(reason: reason.rawValue))
        }
    }

    public func goBack() {
        guard webView.canGoBack else { return }
        webView.goBack()
    }

    public func goForward() {
        guard webView.canGoForward else { return }
        webView.goForward()
    }

    public func reload() {
        pageState = .loading(progress: 0)
        webView.reload()
    }

    public func stopLoading() {
        webView.stopLoading()
        if case .loading = pageState {
            pageState = .loaded
        }
    }

    public func captureSnapshot() {
        guard !isCapturingSnapshot,
              webView.window != nil,
              webView.bounds.width >= 1,
              webView.bounds.height >= 1 else {
            return
        }

        isCapturingSnapshot = true
        let configuration = WKSnapshotConfiguration()
        configuration.rect = webView.bounds
        webView.takeSnapshot(with: configuration) { [weak self] image, _ in
            Task { @MainActor in
                guard let self else { return }
                self.isCapturingSnapshot = false
                if let image, image.size.width >= 1, image.size.height >= 1 {
                    self.snapshot = self.makeTabThumbnail(from: image)
                }
            }
        }
    }

    public func findInPage(_ query: String, backwards: Bool = false) {
        guard let encodedQuery = jsonStringLiteral(query), !query.isEmpty else { return }
        let backwardsFlag = backwards ? "true" : "false"
        webView.evaluateJavaScript("window.find(\(encodedQuery), false, \(backwardsFlag), true)", completionHandler: nil)
    }

    public func countFindMatches(_ query: String, completion: @escaping (Int, Int) -> Void) {
        guard let encodedQuery = jsonStringLiteral(query), !query.isEmpty else {
            completion(0, 0)
            return
        }

        let script = """
        (() => {
          const query = \(encodedQuery);
          const body = document.body ? (document.body.innerText || "") : "";
          if (!query || !body) return JSON.stringify({ current: 0, total: 0 });
          const escaped = query.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&");
          const matches = body.match(new RegExp(escaped, "gi"));
          const total = matches ? matches.length : 0;
          return JSON.stringify({ current: total > 0 ? 1 : 0, total });
        })();
        """

        webView.evaluateJavaScript(script) { result, _ in
            let counts = Self.decodeFindCounts(from: result)
            Task { @MainActor in
                completion(counts.current, counts.total)
            }
        }
    }

    public func clearFindHighlights() {
        webView.evaluateJavaScript("window.getSelection && window.getSelection().removeAllRanges();", completionHandler: nil)
    }

    public func hideDistractingItems() {
        let script = """
        (() => {
          const selectors = ['[class*="ad-"]','[class*="ads-"]','[id*="ad-"]','.ad','.ads','.banner','.popup','.sponsor'];
          selectors.forEach(selector => document.querySelectorAll(selector).forEach(element => element.style.display = 'none'));
        })();
        """
        webView.evaluateJavaScript(script, completionHandler: nil)
    }

    public func translatePage() {
        guard let url = webView.url ?? currentURL,
              url.host?.contains("translate.google") != true,
              var components = URLComponents(string: "https://translate.google.com/translate") else {
            return
        }
        components.queryItems = [
            URLQueryItem(name: "sl", value: "auto"),
            URLQueryItem(name: "tl", value: "vi"),
            URLQueryItem(name: "u", value: url.absoluteString)
        ]
        if let translatedURL = components.url {
            load(translatedURL)
        }
    }

    public func searchChatGPT() {
        var components = URLComponents(string: "https://chatgpt.com/")
        if let url = webView.url ?? currentURL {
            components?.queryItems = [URLQueryItem(name: "q", value: "Explain: \(url.absoluteString)")]
        }
        if let chatURL = components?.url {
            load(chatURL)
        }
    }

    public func adjustTextZoom(by amount: Int) {
        textZoomLevel = min(200, max(50, textZoomLevel + amount))
        webView.evaluateJavaScript("document.body.style.webkitTextSizeAdjust='\(textZoomLevel)%';", completionHandler: nil)
    }

    public func toggleDesktopSite() {
        isDesktopSite.toggle()
        webView.customUserAgent = isDesktopSite
            ? "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"
            : nil
        reload()
    }

    public func copyPageDiagnostics() {
        let url = currentURL?.absoluteString ?? "about:blank"
        UIPasteboard.general.string = "Title: \(title)\nURL: \(url)"
    }

    @discardableResult
    public func printPage() -> Bool {
        guard UIPrintInteractionController.isPrintingAvailable else { return false }

        let printInfo = UIPrintInfo(dictionary: nil)
        printInfo.outputType = .general
        printInfo.jobName = title.isEmpty ? (currentURL?.host ?? "Trang web") : title

        let controller = UIPrintInteractionController.shared
        controller.printInfo = printInfo
        controller.printFormatter = webView.viewPrintFormatter()
        return controller.present(animated: true)
    }

    public var privacySummary: String {
        let url = currentURL ?? webView.url
        let scheme = url?.scheme?.uppercased() ?? "UNKNOWN"
        let host = url?.host ?? "trang hiện tại"
        let store = isPrivate ? "phiên riêng tư, không dùng kho dữ liệu bền vững" : "phiên thường, dùng kho dữ liệu mặc định"
        return "\(host)\nKết nối: \(scheme)\nDữ liệu: \(store)"
    }

    public func retryAfterCrash() {
        crashReloadTask?.cancel()
        crashCount = 0
        lastCrashTime = nil
        lastCrashURL = nil
        pageState = .loading(progress: 0)

        if let url = currentURL ?? webView.url {
            webView.load(URLRequest(url: url))
        } else {
            webView.reload()
        }
    }

    private func setupObservers() {
        webView.publisher(for: \.title)
            .compactMap { $0?.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
            .removeDuplicates()
            .receive(on: RunLoop.main)
            .assign(to: &$title)

        webView.publisher(for: \.url)
            .removeDuplicates()
            .receive(on: RunLoop.main)
            .sink { [weak self] url in
                self?.currentURL = url
            }
            .store(in: &observers)

        webView.publisher(for: \.canGoBack)
            .removeDuplicates()
            .receive(on: RunLoop.main)
            .assign(to: &$canGoBack)

        webView.publisher(for: \.canGoForward)
            .removeDuplicates()
            .receive(on: RunLoop.main)
            .assign(to: &$canGoForward)

        webView.publisher(for: \.estimatedProgress)
            .removeDuplicates()
            .receive(on: RunLoop.main)
            .sink { [weak self] progress in
                guard let self, self.webView.isLoading else { return }
                self.pageState = .loading(progress: progress)
            }
            .store(in: &observers)
    }

    private func handleNavigationError(_ error: Error) {
        let nsError = error as NSError
        if nsError.code == NSURLErrorCancelled || (nsError.domain == "WebKitErrorDomain" && nsError.code == 102) {
            return
        }
        pageState = .failed(.navigationFailed(error.localizedDescription))
    }

    private func scheduleSnapshotCapture() {
        pendingSnapshotTask?.cancel()
        pendingSnapshotTask = Task { [weak self] in
            try? await Task.sleep(nanoseconds: 700_000_000)
            guard !Task.isCancelled else { return }
            await MainActor.run {
                self?.captureSnapshot()
            }
        }
    }

    private func makeTabThumbnail(from image: UIImage) -> UIImage {
        let maxWidth: CGFloat = 520
        guard image.size.width > maxWidth else { return image }

        let scale = maxWidth / image.size.width
        let targetSize = CGSize(width: maxWidth, height: image.size.height * scale)
        let renderer = UIGraphicsImageRenderer(size: targetSize)
        return renderer.image { _ in
            image.draw(in: CGRect(origin: .zero, size: targetSize))
        }
    }

    private func scheduleCrashReload(for webView: WKWebView) {
        crashReloadTask?.cancel()
        let delay: UInt64 = crashCount == 1 ? 1_000_000_000 : 3_000_000_000
        pageState = .loading(progress: 0)

        crashReloadTask = Task { [weak self, weak webView] in
            try? await Task.sleep(nanoseconds: delay)
            guard !Task.isCancelled else { return }
            await MainActor.run {
                guard let self, let webView else { return }
                if let url = self.currentURL ?? webView.url {
                    webView.load(URLRequest(url: url))
                } else {
                    webView.reload()
                }
            }
        }
    }

    private func registerWebContentCrash() {
        let now = Date()
        let crashingURL = webView.url ?? currentURL
        if let lastCrashTime,
           now.timeIntervalSince(lastCrashTime) < Self.crashWindowSeconds,
           lastCrashURL == crashingURL {
            crashCount += 1
        } else {
            crashCount = 1
        }
        self.lastCrashTime = now
        lastCrashURL = crashingURL
    }

    private func jsonStringLiteral(_ value: String) -> String? {
        guard let data = try? JSONEncoder().encode(value) else { return nil }
        return String(data: data, encoding: .utf8)
    }

    private static func decodeFindCounts(from result: Any?) -> (current: Int, total: Int) {
        guard let json = result as? String,
              let data = json.data(using: .utf8),
              let object = try? JSONSerialization.jsonObject(with: data) as? [String: Int] else {
            return (0, 0)
        }
        return (object["current"] ?? 0, object["total"] ?? 0)
    }
}

extension BrowserTabViewModel: WKNavigationDelegate {
    public func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        pageState = .loading(progress: 0)
    }

    public func webView(_ webView: WKWebView, didCommit navigation: WKNavigation!) {
        pageState = .loading(progress: max(0.05, webView.estimatedProgress))
    }

    public func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        pageState = .loaded
        if let url = webView.url {
            currentURL = url
            onUpdateHistory?(url, webView.title ?? url.host ?? "Website")
        }
        scheduleSnapshotCapture()
    }

    public func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        handleNavigationError(error)
    }

    public func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        handleNavigationError(error)
    }

    public func webView(
        _ webView: WKWebView,
        decidePolicyFor navigationAction: WKNavigationAction,
        decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
    ) {
        guard let url = navigationAction.request.url else {
            decisionHandler(.cancel)
            return
        }

        let isMainFrame = navigationAction.targetFrame?.isMainFrame ?? true
        
        let isAdBlockActive = UserDefaults.standard.object(forKey: "browser_adblock_enabled") as? Bool ?? true
        if isAdBlockActive && navigationAction.targetFrame == nil {
            if BrowserAdBlocker.shouldBlockProactively(requestURL: url, sourceURL: webView.url) {
                decisionHandler(.cancel)
                notifyPopupBlocked(url: url)
                return
            }
        }
        
        switch navigationPolicy.decidePolicy(for: url, isMainFrame: isMainFrame) {
        case .allow:
            decisionHandler(.allow)
        case .cancel:
            decisionHandler(.cancel)
        case .openExternal(let externalURL):
            decisionHandler(.cancel)
            onOpenExternalURL?(externalURL)
        case .openNewTab(let newTabURL):
            decisionHandler(.cancel)
            onOpenNewTab?(newTabURL)
        case .blocked(let reason):
            decisionHandler(.cancel)
            pageState = .failed(.securityBlocked(reason: reason.rawValue))
        }
    }

    public func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        pendingSnapshotTask?.cancel()
        registerWebContentCrash()
        if crashCount <= Self.maxAutoReloads {
            scheduleCrashReload(for: webView)
        } else {
            crashReloadTask?.cancel()
            pageState = .failed(.webProcessCrashed)
        }
    }
}

extension BrowserTabViewModel: WKUIDelegate {
    public func webView(
        _ webView: WKWebView,
        createWebViewWith configuration: WKWebViewConfiguration,
        for navigationAction: WKNavigationAction,
        windowFeatures: WKWindowFeatures
    ) -> WKWebView? {
        let isAdBlockActive = UserDefaults.standard.object(forKey: "browser_adblock_enabled") as? Bool ?? true
        
        if isAdBlockActive {
            // Block non-user-initiated popups (script-initiated)
            if navigationAction.navigationType == .other {
                notifyPopupBlocked(url: navigationAction.request.url)
                return nil
            }
            
            // Proactive cross-origin popup check (e.g. gambling/betting redirect new tabs)
            if let url = navigationAction.request.url,
               BrowserAdBlocker.shouldBlockProactively(requestURL: url, sourceURL: webView.url) {
                notifyPopupBlocked(url: url)
                return nil
            }
        }
        
        if let url = navigationAction.request.url {
            onOpenNewTab?(url)
        }
        return nil
    }
    
    private func notifyPopupBlocked(url: URL?) {
        Task { @MainActor in
            if let cachedVM = AppDependencyContainer.cachedBrowserViewModel {
                let host = url?.host ?? "quảng cáo"
                cachedVM.lastPageActionMessage = "Đã chặn quảng cáo tự động từ: \(host)"
            }
        }
    }

    public func webView(
        _ webView: WKWebView,
        runJavaScriptAlertPanelWithMessage message: String,
        initiatedByFrame frame: WKFrameInfo,
        completionHandler: @escaping () -> Void
    ) {
        presentJavaScriptDialog(title: frame.request.url?.host ?? "Trang web", message: message) { alert in
            alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler() })
        } fallback: {
            completionHandler()
        }
    }

    public func webView(
        _ webView: WKWebView,
        runJavaScriptConfirmPanelWithMessage message: String,
        initiatedByFrame frame: WKFrameInfo,
        completionHandler: @escaping (Bool) -> Void
    ) {
        presentJavaScriptDialog(title: frame.request.url?.host ?? "Trang web", message: message) { alert in
            alert.addAction(UIAlertAction(title: "Hủy", style: .cancel) { _ in completionHandler(false) })
            alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler(true) })
        } fallback: {
            completionHandler(false)
        }
    }

    public func webView(
        _ webView: WKWebView,
        runJavaScriptTextInputPanelWithPrompt prompt: String,
        defaultText: String?,
        initiatedByFrame frame: WKFrameInfo,
        completionHandler: @escaping (String?) -> Void
    ) {
        presentJavaScriptDialog(title: frame.request.url?.host ?? "Trang web", message: prompt) { alert in
            alert.addTextField { $0.text = defaultText }
            alert.addAction(UIAlertAction(title: "Hủy", style: .cancel) { _ in completionHandler(nil) })
            alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in
                completionHandler(alert.textFields?.first?.text)
            })
        } fallback: {
            completionHandler(nil)
        }
    }

    private func presentJavaScriptDialog(
        title: String,
        message: String,
        configure: (UIAlertController) -> Void,
        fallback: () -> Void
    ) {
        guard let presenter = topViewController(), presenter.presentedViewController == nil else {
            fallback()
            return
        }

        let alert = UIAlertController(title: title, message: message, preferredStyle: .alert)
        configure(alert)
        presenter.present(alert, animated: true)
    }

    private func topViewController() -> UIViewController? {
        let scene = UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .first { $0.activationState == .foregroundActive }
        var top = scene?.windows.first { $0.isKeyWindow }?.rootViewController
        while let presented = top?.presentedViewController {
            top = presented
        }
        return top
    }
}

extension BrowserTabViewModel: UIScrollViewDelegate {
    public func scrollViewDidScroll(_ scrollView: UIScrollView) {
        let currentY = scrollView.contentOffset.y
        let delta = currentY - lastScrollY

        if currentY <= 0 {
            onScrollDirectionChange?(false)
        } else if scrollView.contentSize.height > scrollView.bounds.height {
            if delta > 12 {
                onScrollDirectionChange?(true)
            } else if delta < -12 {
                onScrollDirectionChange?(false)
            }
        }

        lastScrollY = currentY
    }
}

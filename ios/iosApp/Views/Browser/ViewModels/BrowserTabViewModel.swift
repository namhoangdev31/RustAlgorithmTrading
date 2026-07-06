import Foundation
import WebKit
import Combine
import UIKit

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
    @Published public var textZoomLevel: Int = 100
    @Published public var isDesktopSite: Bool = false

    public var onOpenNewTab: ((URL) -> Void)?
    public var onOpenExternalURL: ((URL) -> Void)?
    public var onUpdateHistory: ((URL, String) -> Void)?
    public var onScrollDirectionChange: ((Bool) -> Void)?

    private var observers: Set<AnyCancellable> = []
    private let navigationPolicy = BrowserNavigationPolicy()
    private var lastScrollY: CGFloat = 0
    private var lastCrashTime: Date? = nil
    private var lastCrashURL: URL? = nil
    private var crashCount: Int = 0
    private static let crashWindowSeconds: TimeInterval = 60
    private static let maxAutoReloads: Int = 2

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
        let webView = self.webView
        Task { @MainActor in
            webView.navigationDelegate = nil
            webView.uiDelegate = nil
            webView.scrollView.delegate = nil
            webView.stopLoading()
        }
    }

    private func setupObservers() {
        webView.publisher(for: \.title)
            .compactMap { $0 }
            .removeDuplicates()
            .assign(to: &$title)

        webView.publisher(for: \.url)
            .removeDuplicates()
            .assign(to: &$currentURL)

        webView.publisher(for: \.canGoBack)
            .removeDuplicates()
            .assign(to: &$canGoBack)

        webView.publisher(for: \.canGoForward)
            .removeDuplicates()
            .assign(to: &$canGoForward)

        webView.publisher(for: \.estimatedProgress)
            .removeDuplicates()
            .sink { [weak self] progress in
                guard let self else { return }
                if self.webView.isLoading {
                    self.pageState = .loading(progress: progress)
                } else if progress >= 1.0 {
                    self.pageState = .loaded
                }
            }
            .store(in: &observers)
    }

    // MARK: - Navigation

    public func load(_ url: URL) {
        let redacted = BrowserURLNormalizer.redactURLForLogging(url)
        print("[BrowserTabViewModel] Loading: \(redacted)")

        let decision = navigationPolicy.decidePolicy(for: url, isMainFrame: true)
        switch decision {
        case .allow:
            currentURL = url
            webView.load(URLRequest(url: url))
        case .cancel:
            break
        case .openExternal(let externalUrl):
            onOpenExternalURL?(externalUrl)
        case .openNewTab(let newTabUrl):
            onOpenNewTab?(newTabUrl)
        case .blocked(let reason):
            pageState = .failed(.securityBlocked(reason: reason.rawValue))
        }
    }

    public func goBack() { if webView.canGoBack { webView.goBack() } }
    public func goForward() { if webView.canGoForward { webView.goForward() } }
    public func reload() { webView.reload() }

    public func stopLoading() {
        webView.stopLoading()
        pageState = .loaded
    }

    public func captureSnapshot() {
        guard webView.bounds.width > 0, webView.bounds.height > 0 else { return }
        webView.takeSnapshot(with: nil) { [weak self] image, _ in
            if let image { self?.snapshot = image }
        }
    }

    public func findInPage(_ query: String, backwards: Bool = false) {
        guard !query.isEmpty,
              let data = try? JSONEncoder().encode(query),
              let encodedQuery = String(data: data, encoding: .utf8) else { return }
        let direction = backwards ? "true" : "false"
        webView.evaluateJavaScript("window.find(\(encodedQuery), false, \(direction), true)", completionHandler: nil)
    }

    /// Count all matches of a query on the page using injected JS.
    /// Calls completion with (currentIndex, totalCount).
    public func countFindMatches(_ query: String, completion: @escaping (Int, Int) -> Void) {
        guard !query.isEmpty,
              let data = try? JSONEncoder().encode(query),
              let encodedQuery = String(data: data, encoding: .utf8) else {
            completion(0, 0)
            return
        }
        let js = """
        (function() {
            var query = \(encodedQuery);
            if (!query) return JSON.stringify({current: 0, total: 0});
            var body = document.body.innerText || '';
            var regex = new RegExp(query.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&'), 'gi');
            var matches = body.match(regex);
            var total = matches ? matches.length : 0;
            // Estimate current index from selection position
            var sel = window.getSelection();
            var current = 0;
            if (sel && sel.rangeCount > 0 && total > 0) {
                var range = sel.getRangeAt(0);
                var preRange = document.createRange();
                preRange.setStart(document.body, 0);
                preRange.setEnd(range.startContainer, range.startOffset);
                var preText = preRange.toString();
                var preMatches = preText.match(regex);
                current = preMatches ? preMatches.length + 1 : 1;
                if (current > total) current = total;
            }
            return JSON.stringify({current: current, total: total});
        })()
        """
        webView.evaluateJavaScript(js) { result, error in
            guard let jsonString = result as? String,
                  let jsonData = jsonString.data(using: .utf8),
                  let dict = try? JSONSerialization.jsonObject(with: jsonData) as? [String: Int] else {
                completion(0, 0)
                return
            }
            let current = dict["current"] ?? 0
            let total = dict["total"] ?? 0
            Task { @MainActor in
                completion(current, total)
            }
        }
    }

    /// Clear find highlights and deselect any active selection.
    public func clearFindHighlights() {
        webView.evaluateJavaScript("window.getSelection().removeAllRanges()", completionHandler: nil)
    }

    public func hideDistractingItems() {
        let js = """
        (function() {
            ['[class*="ad-"]','[class*="ads-"]','[id*="ad-"]','.ad','.ads','.banner','.popup','.sponsor']
            .forEach(sel => document.querySelectorAll(sel).forEach(el => el.style.display='none'));
        })()
        """
        webView.evaluateJavaScript(js, completionHandler: nil)
    }

    public func translatePage() {
        guard let url = webView.url,
              !(url.host?.contains("translate.google") == true) else { return }
        let str = "https://translate.google.com/translate?sl=auto&tl=vi&u=\(url.absoluteString)"
        if let translateURL = URL(string: str) { load(translateURL) }
    }

    public func searchChatGPT() {
        let base = webView.url.map { "https://chatgpt.com/?q=Explain: \($0.absoluteString)" } ?? "https://chatgpt.com"
        if let url = URL(string: base.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? base) {
            load(url)
        }
    }

    public func adjustTextZoom(by amount: Int) {
        textZoomLevel = max(50, min(200, textZoomLevel + amount))
        webView.evaluateJavaScript("document.body.style.webkitTextSizeAdjust='\(textZoomLevel)%';", completionHandler: nil)
    }

    public func toggleDesktopSite() {
        isDesktopSite.toggle()
        webView.customUserAgent = isDesktopSite
            ? "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"
            : nil
        webView.reload()
    }

    public func copyPageDiagnostics() {
        let url = currentURL?.absoluteString ?? "about:blank"
        UIPasteboard.general.string = "Title: \(title)\nURL: \(url)"
    }

    @discardableResult
    public func printPage() -> Bool {
        guard UIPrintInteractionController.isPrintingAvailable else {
            return false
        }
        let printInfo = UIPrintInfo(dictionary: nil)
        printInfo.outputType = .general
        printInfo.jobName = title.isEmpty ? (currentURL?.host ?? "Trang web") : title

        let controller = UIPrintInteractionController.shared
        controller.printInfo = printInfo
        controller.printFormatter = webView.viewPrintFormatter()
        return controller.present(animated: true, completionHandler: nil)
    }

    public var privacySummary: String {
        let scheme = currentURL?.scheme?.uppercased() ?? "UNKNOWN"
        let host = currentURL?.host ?? "trang hiện tại"
        let store = isPrivate ? "phiên riêng tư, không dùng kho dữ liệu bền vững" : "phiên thường, dùng kho dữ liệu mặc định"
        return "\(host)\nKết nối: \(scheme)\nDữ liệu: \(store)"
    }
}

// MARK: - WKNavigationDelegate
extension BrowserTabViewModel: WKNavigationDelegate {
    public func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        pageState = .loading(progress: 0.0)
    }

    public func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        pageState = .loaded
        if let url = webView.url {
            onUpdateHistory?(url, webView.title ?? url.host ?? "Website")
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
            self?.captureSnapshot()
        }
    }

    public func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        let e = error as NSError
        guard e.code != NSURLErrorCancelled, !(e.domain == "WebKitErrorDomain" && e.code == 102) else { return }
        pageState = .failed(.navigationFailed(error.localizedDescription))
    }

    public func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        let e = error as NSError
        guard e.code != NSURLErrorCancelled, !(e.domain == "WebKitErrorDomain" && e.code == 102) else { return }
        pageState = .failed(.navigationFailed(error.localizedDescription))
    }

    public func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else {
            decisionHandler(.cancel); return
        }
        let isMainFrame = navigationAction.targetFrame?.isMainFrame ?? false
        switch navigationPolicy.decidePolicy(for: url, isMainFrame: isMainFrame) {
        case .allow:            decisionHandler(.allow)
        case .cancel:           decisionHandler(.cancel)
        case .openExternal(let u): decisionHandler(.cancel); onOpenExternalURL?(u)
        case .openNewTab(let u):   decisionHandler(.cancel); onOpenNewTab?(u)
        case .blocked(let reason):
            decisionHandler(.cancel)
            pageState = .failed(.securityBlocked(reason: reason.rawValue))
        }
    }

    public func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        let now = Date()
        let crashingURL = webView.url ?? currentURL

        // Reset crash counter if outside crash window or URL changed
        if let lastTime = lastCrashTime,
           now.timeIntervalSince(lastTime) < Self.crashWindowSeconds,
           lastCrashURL == crashingURL {
            crashCount += 1
        } else {
            crashCount = 1
        }
        lastCrashTime = now
        lastCrashURL = crashingURL

        let redacted = crashingURL.map { BrowserURLNormalizer.redactURLForLogging($0) } ?? "nil"
        print("[BrowserTabViewModel] Web process terminated (crash #\(crashCount)) for \(redacted)")

        if crashCount <= Self.maxAutoReloads {
            // Exponential backoff: 1s for first, 3s for second
            let delay = crashCount == 1 ? 1.0 : 3.0
            pageState = .loading(progress: 0.0)
            DispatchQueue.main.asyncAfter(deadline: .now() + delay) { [weak self, weak webView] in
                guard let self, let webView else { return }
                print("[BrowserTabViewModel] Auto-reloading after \(delay)s backoff (attempt #\(self.crashCount))")
                webView.reload()
            }
        } else {
            print("[BrowserTabViewModel] Web process crashed \(crashCount) times — halting. User must retry manually.")
            pageState = .failed(.webProcessCrashed)
        }
    }

    /// Manual retry after crash halt — resets crash counter.
    public func retryAfterCrash() {
        crashCount = 0
        lastCrashTime = nil
        lastCrashURL = nil
        if let url = currentURL {
            load(url)
        } else {
            webView.reload()
        }
    }
}

// MARK: - WKUIDelegate
extension BrowserTabViewModel: WKUIDelegate {
    public func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = navigationAction.request.url { onOpenNewTab?(url) }
        return nil
    }

    public func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        guard let presenter = topViewController() else {
            completionHandler()
            return
        }
        let alert = UIAlertController(title: frame.request.url?.host ?? "Trang web", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler() })
        presenter.present(alert, animated: true)
    }

    public func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        guard let presenter = topViewController() else {
            completionHandler(false)
            return
        }
        let alert = UIAlertController(title: frame.request.url?.host ?? "Trang web", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "Hủy", style: .cancel) { _ in completionHandler(false) })
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler(true) })
        presenter.present(alert, animated: true)
    }

    public func webView(_ webView: WKWebView, runJavaScriptTextInputPanelWithPrompt prompt: String, defaultText: String?, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (String?) -> Void) {
        guard let presenter = topViewController() else {
            completionHandler(nil)
            return
        }
        let alert = UIAlertController(title: frame.request.url?.host ?? "Trang web", message: prompt, preferredStyle: .alert)
        alert.addTextField { textField in
            textField.text = defaultText
        }
        alert.addAction(UIAlertAction(title: "Hủy", style: .cancel) { _ in completionHandler(nil) })
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in
            completionHandler(alert.textFields?.first?.text)
        })
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

// MARK: - UIScrollViewDelegate
extension BrowserTabViewModel: UIScrollViewDelegate {
    public func scrollViewDidScroll(_ scrollView: UIScrollView) {
        let currentY = scrollView.contentOffset.y
        let delta = currentY - lastScrollY
        if currentY > 0 && scrollView.contentSize.height > scrollView.frame.size.height {
            if delta > 12 { onScrollDirectionChange?(true) }
            else if delta < -12 { onScrollDirectionChange?(false) }
        } else if currentY <= 0 {
            onScrollDirectionChange?(false)
        }
        lastScrollY = currentY
    }
}

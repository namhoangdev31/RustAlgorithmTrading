import SwiftUI
import WebKit

// import Shared — replaced by native Swift Shared module

@MainActor
class RuntimeWebView: WKWebView, WKScriptMessageHandler, BridgeResponseSending {
    private let manifest: WebRuntimeManifest
    private let bundlePath: URL
    private let serverURL: URL
    private let tabId: UUID
    private let bridgeRouter: BridgeRouter
    private let processRecoveryManager: ProcessRecoveryManager
    private let onRuntimeError: (RuntimeShellError) -> Void
    
    // Custom Init
    init(
        frame: CGRect,
        manifest: WebRuntimeManifest,
        bundlePath: URL,
        serverURL: URL,
        tabId: UUID,
        bridgeRouter: BridgeRouter? = nil,
        processRecoveryManager: ProcessRecoveryManager? = nil,
        onRuntimeError: @escaping (RuntimeShellError) -> Void = { _ in }
    ) {
        self.tabId = tabId
        self.manifest = manifest
        self.bundlePath = bundlePath
        self.serverURL = serverURL
        self.bridgeRouter = bridgeRouter ?? .shared
        self.processRecoveryManager = processRecoveryManager ?? ProcessRecoveryManager()
        self.onRuntimeError = onRuntimeError
        let config = WKWebViewConfiguration()

        // Sandboxed Website Data Store (iOS 17+)
        if #available(iOS 17.0, *) {
            let dataStoreId = UUID(uuidString: "e8568600-0000-0000-0000-" + String(format: "%012x", abs(manifest.id.hashValue))) ?? UUID()
            config.websiteDataStore = WKWebsiteDataStore(forIdentifier: dataStoreId)
        } else {
            config.websiteDataStore = WKWebsiteDataStore.default()
        }

        // 1. Setup Bridge
        let userContent = WKUserContentController()

        config.userContentController = userContent

        // 2. Performance Config
        config.preferences.javaScriptCanOpenWindowsAutomatically = false

        super.init(frame: frame, configuration: config)

        // Register Bridge Handler after super.init
        self.configuration.userContentController.add(self, name: "LeposBridge")
        self.configuration.userContentController.add(self, name: "lepoShipBridge")

        // 2.a Inject Console Bridge
        let consoleBridgeJS = """
            (function() {
                var oldLog = console.log;
                var oldWarn = console.warn;
                var oldError = console.error;
                console.log = function(message) {
                    window.webkit.messageHandlers.LeposBridge.postMessage({action: 'log', level: 'info', message: String(message)});
                    oldLog.apply(console, arguments);
                };
                console.warn = function(message) {
                    window.webkit.messageHandlers.LeposBridge.postMessage({action: 'log', level: 'warn', message: String(message)});
                    oldWarn.apply(console, arguments);
                };
                console.error = function(message) {
                    window.webkit.messageHandlers.LeposBridge.postMessage({action: 'log', level: 'error', message: String(message)});
                    oldError.apply(console, arguments);
                };
                console.log('LeposBridge: Console Hooked');
            })();
            """
        let consoleScript = WKUserScript(
            source: consoleBridgeJS, injectionTime: .atDocumentStart, forMainFrameOnly: true)
        self.configuration.userContentController.addUserScript(consoleScript)

        // 3. UI Config
        self.navigationDelegate = self
        self.scrollView.bounces = false  // Tắt bounce scroll native của iOS
        self.scrollView.showsVerticalScrollIndicator = false
        self.scrollView.showsHorizontalScrollIndicator = false
        self.scrollView.contentInsetAdjustmentBehavior = .automatic  // Native Safe Area Behavior
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) has not been implemented") }

    func shutdownBridge() {
        configuration.userContentController.removeScriptMessageHandler(forName: "LeposBridge")
        configuration.userContentController.removeScriptMessageHandler(forName: "lepoShipBridge")
    }

    func sendResponse(requestId: String, data: [String: Any]?, errorCode: String? = nil, errorMessage: String? = nil) {
        var responseDict: [String: Any] = [:]
        responseDict["requestId"] = requestId
        
        if let code = errorCode {
            responseDict["success"] = false
            responseDict["error"] = [
                "code": code,
                "message": errorMessage ?? "An error occurred."
            ]
        } else {
            responseDict["success"] = true
            if let data = data {
                responseDict["data"] = data
            }
        }
        
        if let jsonObj = try? JSONSerialization.data(withJSONObject: responseDict, options: []),
           let jsonString = String(data: jsonObj, encoding: .utf8),
           let requestIdData = try? JSONSerialization.data(withJSONObject: requestId, options: []),
           let requestIdString = String(data: requestIdData, encoding: .utf8) {
            DispatchQueue.main.async {
                self.evaluateJavaScript("window.__lepoShipReceiveMessage(\(requestIdString), \(jsonString))", completionHandler: nil)
            }
        }
    }

    // Process JS Messages
    func userContentController(
        _ userContentController: WKUserContentController, didReceive message: WKScriptMessage
    ) {
        let context = BridgeRouteContext(
            manifest: manifest,
            bundlePath: bundlePath,
            serverURL: serverURL,
            tabId: tabId,
            onRuntimeReady: { [weak self] in
                guard let self = self else { return }
                print("[WebRuntime] runtime.ready received for \(self.manifest.id)")
                self.processRecoveryManager.recordRuntimeReady(
                    tabId: self.tabId,
                    appId: self.manifest.id,
                    version: self.manifest.version
                )
            },
            onHotReload: { payload in
                print("[WebRuntime] Hot reload message received: \(payload)")
            },
            onRuntimeError: onRuntimeError
        )
        bridgeRouter.route(message: message, context: context, responder: self)
    }

    func loadBundle(httpUrl: String) {
        print("[WebRuntime] Loading from HTTP: \(httpUrl)")
        if let url = URL(string: httpUrl) {
            // Force reload ignoring cache to prevent stale index.html (e.g. from previous runs)
            let request = URLRequest(
                url: url, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 10.0)
            self.load(request)
        } else {
            print("[WebRuntime] Invalid URL: \(httpUrl)")
        }
    }
}

extension RuntimeWebView: WKNavigationDelegate {
    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        print("[WebRuntime] Page started loading")
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        print("[WebRuntime] Page finished loading")
        webView.evaluateJavaScript("document.dispatchEvent(new Event('runtimeresume'))")
        processRecoveryManager.recordNavigationFinished(
            tabId: tabId,
            appId: manifest.id,
            version: manifest.version
        )
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        print("[WebRuntime] Navigation failed: \(error.localizedDescription)")
    }

    func webView(
        _ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!,
        withError error: Error
    ) {
        print("[WebRuntime] Provisional navigation failed: \(error.localizedDescription)")
    }

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        processRecoveryManager.handleWebContentTermination(
            tabId: tabId,
            manifest: manifest,
            reload: { [weak self] in
                print("[WebRuntime] Re-loading tab after process termination...")
                self?.reload()
            },
            reportError: onRuntimeError,
            close: { [weak self] in
                self?.stopLoading()
            }
        )
    }

    func webView(
        _ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
        decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
    ) {
        guard let url = navigationAction.request.url else {
            decisionHandler(.cancel)
            return
        }
        
        guard let scheme = url.scheme?.lowercased() else {
            decisionHandler(.cancel)
            return
        }
        
        if scheme == "http" || scheme == "https" || url.absoluteString == "about:blank" {
            decisionHandler(.allow)
            return
        }
        
        if scheme == "file" || scheme == "javascript" || (scheme == "data" && (navigationAction.targetFrame?.isMainFrame ?? false)) {
            decisionHandler(.cancel)
            return
        }
        
        decisionHandler(.cancel)
        DispatchQueue.main.async {
            UIApplication.shared.open(url, options: [:], completionHandler: nil)
        }
    }
}

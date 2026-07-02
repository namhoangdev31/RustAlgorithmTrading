import SwiftUI
import WebKit

// import Shared — replaced by native Swift Shared module

class RuntimeWebView: WKWebView, WKScriptMessageHandler {
    private let manifest: WebRuntimeManifest
    private let bundlePath: URL
    private let serverURL: URL
    private let tabId: UUID
    
    private var isDidFinishLoaded = false
    private var isRuntimeReady = false
    private var isMarkedStable = false
    private var localCrashCount = 0

    // Custom Init
    init(frame: CGRect, manifest: WebRuntimeManifest, bundlePath: URL, serverURL: URL, tabId: UUID) {
        self.tabId = tabId
        self.manifest = manifest
        self.bundlePath = bundlePath
        self.serverURL = serverURL
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
           let jsonString = String(data: jsonObj, encoding: .utf8) {
            DispatchQueue.main.async {
                self.evaluateJavaScript("window.__lepoShipReceiveMessage('\(requestId)', \(jsonString))", completionHandler: nil)
            }
        }
    }

    // Process JS Messages
    func userContentController(
        _ userContentController: WKUserContentController, didReceive message: WKScriptMessage
    ) {
        guard (message.name == "LeposBridge" || message.name == "lepoShipBridge"), let body = message.body as? [String: Any] else {
            return
        }

        let requestId = body["requestId"] as? String ?? ""
        let payload = body["payload"] as? [String: Any] ?? [:]

        // 1. Origin Check: verify request initiator matches host + port + scheme of the active WebTab
        let originHost = message.frameInfo.securityOrigin.host
        let originPort = message.frameInfo.securityOrigin.port
        let originScheme = message.frameInfo.securityOrigin.protocol
        
        guard originScheme == self.serverURL.scheme,
              originHost == self.serverURL.host,
              originPort == self.serverURL.port else {
            let fullOrigin = "\(originScheme)://\(originHost):\(originPort)"
            print("[Security] Rejecting bridge call from unauthorized origin: \(fullOrigin). Expected: \(self.serverURL.absoluteString)")
            if !requestId.isEmpty {
                sendResponse(
                    requestId: requestId,
                    data: nil,
                    errorCode: "UNAUTHORIZED_ORIGIN",
                    errorMessage: "Security origin '\(fullOrigin)' is not authorized."
                )
            }
            return
        }

        if let action = body["action"] as? String {
            // 2. Resolve permission requirements via BridgeACL
            if let requiredPermission = BridgeACL.requiredPermission(forAction: action, payload: payload) {
                // 3. Request/check 3-layer authorization
                PermissionManager.shared.checkAndRequestPermission(
                    appId: self.manifest.id,
                    appName: self.manifest.name,
                    permission: requiredPermission,
                    manifest: self.manifest
                ) { [weak self] granted in
                    guard let self = self else { return }
                    if granted {
                        DispatchQueue.main.async {
                            self.executeAction(action: action, payload: payload, body: body, requestId: requestId)
                        }
                    } else {
                        if !requestId.isEmpty {
                            self.sendResponse(
                                requestId: requestId,
                                data: nil,
                                errorCode: "PERMISSION_DENIED",
                                errorMessage: "Required permission '\(requiredPermission.rawValue)' was denied or not declared in manifest."
                            )
                        }
                    }
                }
            } else {
                // 4. Public action: execute immediately
                self.executeAction(action: action, payload: payload, body: body, requestId: requestId)
            }
        }
    }

    private func executeAction(action: String, payload: [String: Any], body: [String: Any], requestId: String) {
        // Lifecycle and runtime management actions executed inside webview scope
        if action == "ready" || action == "runtime.ready" {
            print("[WebRuntime] runtime.ready received for \(self.manifest.id)")
            self.isRuntimeReady = true
            self.checkAndMarkStable()
            if !requestId.isEmpty {
                sendResponse(requestId: requestId, data: ["success": true])
            }
            return
        }
        
        if action == "hotReload" {
            print("[WebRuntime] Hot reload message received: \(payload)")
            if !requestId.isEmpty {
                sendResponse(requestId: requestId, data: ["success": true])
            }
            return
        }

        // 1. Rate Limiting Check using appId + tabId + action
        guard BridgeRateLimiter.shared.isAllowed(appId: self.manifest.id, tabId: self.tabId, action: action) else {
            if !requestId.isEmpty {
                sendResponse(
                    requestId: requestId,
                    data: nil,
                    errorCode: "RATE_LIMIT_EXCEEDED",
                    errorMessage: "Rate limit exceeded for action '\(action)' on this tab."
                )
            }
            BridgeAuditLogger.shared.logCall(
                appId: self.manifest.id,
                action: action,
                permission: nil,
                success: false,
                errorCode: "RATE_LIMIT_EXCEEDED",
                errorMessage: "Rate limit exceeded"
            )
            return
        }

        // 2. Native feature actions routed dynamically via PluginRegistry
        PluginRegistry.shared.execute(action: action, payload: payload, bundlePath: self.bundlePath) { [weak self] result in
            guard let self = self else { return }
            let permission = BridgeACL.requiredPermission(forAction: action, payload: payload)?.rawValue
            
            switch result {
            case .success(let data):
                if !requestId.isEmpty {
                    self.sendResponse(requestId: requestId, data: data)
                }
                BridgeAuditLogger.shared.logCall(
                    appId: self.manifest.id,
                    action: action,
                    permission: permission,
                    success: true
                )
            case .failure(let error):
                if !requestId.isEmpty {
                    self.sendResponse(
                        requestId: requestId,
                        data: nil,
                        errorCode: "EXECUTION_ERROR",
                        errorMessage: error.localizedDescription
                    )
                }
                BridgeAuditLogger.shared.logCall(
                    appId: self.manifest.id,
                    action: action,
                    permission: permission,
                    success: false,
                    errorCode: "EXECUTION_ERROR",
                    errorMessage: error.localizedDescription
                )
            }
        }
    }

    private func checkAndMarkStable() {
        guard isDidFinishLoaded && isRuntimeReady && !isMarkedStable else { return }
        isMarkedStable = true
        // Allow a 2.0s buffer of crash-free execution before officially resetting attempts
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) { [weak self] in
            guard let self = self else { return }
            self.localCrashCount = 0
            MiniAppManager.shared.markStable(appId: self.manifest.id, version: self.manifest.version)
        }
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
        self.isDidFinishLoaded = true
        self.checkAndMarkStable()
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
        self.localCrashCount += 1
        let delay: TimeInterval = self.localCrashCount == 2 ? 1.0 : 0.0
        
        print("[WebRuntime] Web content process terminated (crash detected). Crash count: \(self.localCrashCount). Attempting recovery with delay \(delay)s...")
        
        MiniAppManager.shared.registerLaunch(appId: self.manifest.id, currentVersion: self.manifest.version) { [weak self] result in
            guard let self = self else { return }
            DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
                switch result {
                case .success:
                    print("[WebRuntime] Re-loading tab after process termination...")
                    self.reload()
                case .failure(let error):
                    print("[WebRuntime] Crash limit exceeded. Version rolled back: \(error.localizedDescription)")
                    NotificationCenter.default.post(name: NSNotification.Name("CloseMiniApp"), object: nil)
                }
            }
        }
    }
}

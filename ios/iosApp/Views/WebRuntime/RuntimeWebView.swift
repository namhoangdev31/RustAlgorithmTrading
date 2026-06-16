import SwiftUI
import WebKit

// import Shared — replaced by native Swift Shared module

class RuntimeWebView: WKWebView, WKScriptMessageHandler {

    // Custom Init
    init(frame: CGRect, manifest: WebRuntimeManifest) {
        let config = WKWebViewConfiguration()

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

    func sendResponse(requestId: String, data: [String: Any]?, error: String? = nil) {
        var responseDict: [String: Any] = [:]
        if let data = data {
            responseDict["data"] = data
        }
        if let error = error {
            responseDict["error"] = error
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

        if let action = body["action"] as? String {
            switch action {
            case "log", "debug.log":
                let level = payload["level"] as? String ?? body["level"] as? String ?? "info"
                let msg = payload["message"] as? String ?? body["message"] as? String ?? ""
                print("[WebConsole][\(level)] \(msg)")
                if !requestId.isEmpty {
                    sendResponse(requestId: requestId, data: ["success": true])
                }
            case "vibrate":
                let generator = UIImpactFeedbackGenerator(style: .medium)
                generator.impactOccurred()
                if !requestId.isEmpty {
                    sendResponse(requestId: requestId, data: ["success": true])
                }
            case "close":
                // Notify ViewController to dismiss
                NotificationCenter.default.post(
                    name: NSNotification.Name("CloseMiniApp"), object: nil)
                if !requestId.isEmpty {
                    sendResponse(requestId: requestId, data: ["success": true])
                }
            case "camera.takePhoto", "getCameraPhoto":
                if !requestId.isEmpty {
                    sendResponse(requestId: requestId, data: ["uri": "https://via.placeholder.com/600x400.png?text=NativeCameraPhoto"])
                }
            case "plugin.invoke":
                let plugin = payload["plugin"] as? String ?? ""
                let method = payload["method"] as? String ?? ""
                let args = payload["args"] as? [String: Any] ?? [:]
                if !requestId.isEmpty {
                    sendResponse(requestId: requestId, data: [
                        "success": true,
                        "plugin": plugin,
                        "method": method,
                        "result": args
                    ])
                }
            case "hotReload":
                print("[WebRuntime] Hot reload message received: \(payload)")
                if !requestId.isEmpty {
                    sendResponse(requestId: requestId, data: ["success": true])
                }
            default:
                if !requestId.isEmpty {
                    sendResponse(requestId: requestId, data: ["success": true])
                }
            }
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
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        print("[WebRuntime] Navigation failed: \(error.localizedDescription)")
    }

    func webView(
        _ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!,
        withError error: Error
    ) {
        print("[WebRuntime] Provisional Navigation failed: \(error.localizedDescription)")
    }
}

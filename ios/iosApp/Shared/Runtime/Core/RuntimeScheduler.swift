import Foundation
import WebKit

/// Central Scheduler coordinating execution states across active WebView pools, servers, and scripts
@MainActor
final class RuntimeScheduler {
    static let shared = RuntimeScheduler()
    
    private var currentState: RuntimeSchedulerState = .foreground
    
    private init() {}
    
    /// Transitions a WebTab to a new scheduling state, pausing/resuming servers and notifying JS cooperatively.
    func transition(tab: WebTab, to state: RuntimeSchedulerState) {
        self.currentState = state
        print("[RuntimeScheduler] Transitioning tab \(tab.id) to: \(state)")
        
        switch state {
        case .foreground:
            // 1. Resume local server if paused
            _ = try? tab.server.resume()
            // 2. Dispatch runtimeresume event to JS
            tab.webView?.evaluateJavaScript("document.dispatchEvent(new Event('runtimeresume'))")
            
        case .background:
            // 1. Dispatch runtimepause event to JS for cooperative state freezes
            tab.webView?.evaluateJavaScript("document.dispatchEvent(new Event('runtimepause'))")
            // 2. Pause server to free ports and resources
            tab.server.pause()
            
        case .hidden:
            // 1. Dispatch runtimehidden event to JS
            tab.webView?.evaluateJavaScript("document.dispatchEvent(new Event('runtimehidden'))")
            // 2. Clean Wasm cache to release memory
            WasmExecutor.shared.clearCachedModules()
            
        case .suspended:
            // 1. Fully release WebView to save RAM
            tab.webView?.stopLoading()
            tab.webView?.shutdownBridge()
            tab.webView = nil
            
            // 2. Stop server completely
            tab.server.stop()
        }
    }
}

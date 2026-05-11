import Foundation
// import Shared — replaced by native Swift Shared module

@MainActor
class WebRuntimeViewModel: ObservableObject {
    @Published var state: WebRuntimeState = WebRuntimeState.Idle()
    
    private var server: iOSWebServer?
    private let serverPort: UInt16 = 8080
    
    func loadBundle(manifest: WebRuntimeManifest, bundlePath: URL) {
        // Stop existing server first to prevent port conflicts
        stopServer()
        
        self.state = WebRuntimeState.Loading()
        
        // 1. Start embedded HTTP server
        server = iOSWebServer(port: serverPort, basePath: bundlePath.path)
        server?.start()
        
        // 2. Resolve URL logic
        let httpUrl = "http://127.0.0.1:\(serverPort)"
        if true {
             self.state = WebRuntimeState.Ready(entryUrl: httpUrl)
        } else {
            self.state = WebRuntimeState.Error(message: "Failed to resolve bundle URL", code: nil)
        }
    }
    
    func stopServer() {
        server?.stop()
        server = nil
    }
    
    nonisolated deinit {
        // Stop server async from non-isolated context
        Task.detached { [server] in
            await MainActor.run {
                server?.stop()
            }
        }
    }
}

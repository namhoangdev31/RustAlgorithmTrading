import Foundation

@MainActor
class WebRuntimeViewModel: ObservableObject {
    @Published var state: WebRuntimeState = .idle

    private var server: iOSWebServer?
    private let serverPort: UInt16 = 8080

    func loadBundle(manifest: WebRuntimeManifest, bundlePath: URL) {
        stopServer()
        state = .loading

        server = iOSWebServer(port: serverPort, basePath: bundlePath.path)
        server?.start()

        let httpUrl = "http://127.0.0.1:\(serverPort)"
        state = .ready(bundlePath: httpUrl)
    }

    func stopServer() {
        server?.stop()
        server = nil
    }

    nonisolated deinit {
        Task.detached { [server] in
            await MainActor.run {
                server?.stop()
            }
        }
    }
}

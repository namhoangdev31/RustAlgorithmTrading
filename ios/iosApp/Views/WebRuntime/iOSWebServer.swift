import Foundation
import GCDWebServer

/// iOS embedded HTTP server using GCDWebServer
/// Serves web bundles (Expo, Flutter Web) from local filesystem
class iOSWebServer {
    private let webServer = GCDWebServer()
    private let port: UInt
    private let basePath: String

    init(port: UInt16, basePath: String) {
        self.port = UInt(port)
        self.basePath = basePath
        configure()
    }

    private func configure() {
        // Serve static files from basePath with SPA support
        webServer.addGETHandler(
            forBasePath: "/",
            directoryPath: basePath,
            indexFilename: "index.html",
            cacheAge: 0,  // No caching during development
            allowRangeRequests: true
        )

        print("[iOSWebServer] Configured to serve: \(basePath)")
    }

    func start() {
        do {
            try webServer.start(options: [
                GCDWebServerOption_Port: port,
                GCDWebServerOption_BindToLocalhost: true,
                GCDWebServerOption_AutomaticallySuspendInBackground: false,
            ])

            if let serverURL = webServer.serverURL {
                print("[iOSWebServer] Server started at \(serverURL.absoluteString)")
            }
        } catch {
            print("[iOSWebServer] Failed to start: \(error.localizedDescription)")
        }
    }

    func stop() {
        if webServer.isRunning {
            webServer.stop()
            print("[iOSWebServer] Server stopped")
        }
    }

    func isRunning() -> Bool {
        return webServer.isRunning
    }
}

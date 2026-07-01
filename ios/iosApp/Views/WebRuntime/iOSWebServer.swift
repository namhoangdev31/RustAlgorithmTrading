import Foundation
import GCDWebServer

enum WebServerState: Equatable {
    case stopped
    case starting
    case running
    case stopping
    case failed(Error)

    static func == (lhs: WebServerState, rhs: WebServerState) -> Bool {
        switch (lhs, rhs) {
        case (.stopped, .stopped),
             (.starting, .starting),
             (.running, .running),
             (.stopping, .stopping):
            return true
        case (.failed, .failed):
            return true
        default:
            return false
        }
    }
}

enum WebServerError: Error, LocalizedError {
    case failedToStart
    
    var errorDescription: String? {
        switch self {
        case .failedToStart:
            return "Failed to start GCDWebServer instance."
        }
    }
}

/// iOS embedded HTTP server using GCDWebServer
/// Serves web bundles (Expo, Flutter Web) from local filesystem
class iOSWebServer {
    private let webServer = GCDWebServer()
    private(set) var port: UInt16
    private let basePath: String
    
    private(set) var state: WebServerState = .stopped
    private(set) var serverURL: URL?

    init(port: UInt16 = 0, basePath: String) {
        self.port = port
        self.basePath = basePath
        configure()
    }

    private func configure() {
        // Intercept WASM files to serve with correct MIME type and path traversal protection
        webServer.addHandler(
            forMethod: "GET",
            pathRegex: "^/.*\\.wasm$",
            request: GCDWebServerRequest.self,
            processBlock: { [weak self] request in
                guard let self = self else { return GCDWebServerResponse(statusCode: 500) }
                
                let requestedPath = request.path
                let resolvedURL = URL(fileURLWithPath: self.basePath).appendingPathComponent(requestedPath).standardized
                let baseURL = URL(fileURLWithPath: self.basePath).standardized
                
                // Path Traversal Protection
                guard resolvedURL.path.hasPrefix(baseURL.path) else {
                    print("[Security] Blocked path traversal attempt: \(requestedPath)")
                    return GCDWebServerResponse(statusCode: 403)
                }
                
                let filePath = resolvedURL.path
                if FileManager.default.fileExists(atPath: filePath) {
                    let response = GCDWebServerFileResponse(file: filePath, byteRange: request.byteRange)
                    response?.contentType = "application/wasm"
                    return response
                }
                return GCDWebServerResponse(statusCode: 404)
            }
        )

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

    func start() throws -> URL {
        self.state = .starting
        do {
            try webServer.start(options: [
                GCDWebServerOption_Port: UInt(port),
                GCDWebServerOption_BindToLocalhost: true,
                GCDWebServerOption_AutomaticallySuspendInBackground: false,
            ])

            guard let url = webServer.serverURL else {
                let err = WebServerError.failedToStart
                self.state = .failed(err)
                throw err
            }

            self.serverURL = url
            self.port = UInt16(url.port ?? 0)
            self.state = .running
            print("[iOSWebServer] Server started at \(url.absoluteString)")
            return url
        } catch {
            self.state = .failed(error)
            throw error
        }
    }

    func stop() {
        self.state = .stopping
        if webServer.isRunning {
            webServer.stop()
            print("[iOSWebServer] Server stopped")
        }
        self.state = .stopped
    }

    func pause() {
        guard state == .running else { return }
        webServer.stop()
        state = .stopped
        print("[iOSWebServer] Server paused (stopped to free port)")
    }

    func resume() throws -> URL {
        guard state == .stopped else {
            return serverURL ?? URL(string: "http://127.0.0.1:\(port)")!
        }
        return try start()
    }

    func isRunning() -> Bool {
        return webServer.isRunning
    }
}

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
    private var mountedDirectories: [String: String] = [:]

    init(port: UInt16 = 0, basePath: String) {
        self.port = port
        self.basePath = basePath
        configure()
    }
    
    func mountDirectory(_ virtualPath: String, directoryPath: String) {
        let cleanVirtual = virtualPath.hasPrefix("/") ? virtualPath : "/\(virtualPath)"
        mountedDirectories[cleanVirtual] = directoryPath
        print("[iOSWebServer] Mounted virtual directory '\(cleanVirtual)' to: \(directoryPath)")
    }

    private func configure() {
        // Secure, catch-all static server handler
        webServer.addHandler(
            forMethod: "GET",
            pathRegex: "^/.*$",
            request: GCDWebServerRequest.self,
            processBlock: { [weak self] request in
                guard let self = self else { return GCDWebServerResponse(statusCode: 500) }
                
                let requestedPath = request.path
                
                // 1.a Intercept mounted virtual directories (Shared Libraries)
                for (prefix, localDir) in self.mountedDirectories {
                    if requestedPath.hasPrefix(prefix) {
                        let relativePath = String(requestedPath.dropFirst(prefix.count))
                        let resolvedURL = URL(fileURLWithPath: localDir).appendingPathComponent(relativePath).standardized
                        let baseURL = URL(fileURLWithPath: localDir).standardized
                        
                        // Path Traversal Check for mounted folder
                        guard resolvedURL.path.hasPrefix(baseURL.path) else {
                            return GCDWebServerResponse(statusCode: 403)
                        }
                        
                        if FileManager.default.fileExists(atPath: resolvedURL.path) {
                            let response = GCDWebServerFileResponse(file: resolvedURL.path, byteRange: request.byteRange)
                            let fileExtension = resolvedURL.pathExtension.lowercased()
                            if fileExtension == "wasm" {
                                response?.contentType = "application/wasm"
                            } else if fileExtension == "js" {
                                response?.contentType = "application/javascript"
                            } else if fileExtension == "css" {
                                response?.contentType = "text/css"
                            }
                            return response
                        }
                    }
                }
                
                // 1. Host Header Validation
                if let host = request.headers["Host"] {
                    let allowedHosts = [
                        "127.0.0.1:\(self.port)",
                        "localhost:\(self.port)",
                        "127.0.0.1",
                        "localhost"
                    ]
                    let cleanedHost = host.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
                    let hasValidHost = allowedHosts.contains { allowed in
                        cleanedHost == allowed || cleanedHost.hasPrefix(allowed + ":")
                    }
                    if !hasValidHost {
                        print("[Security] Blocked unauthorized Host header: \(host)")
                        return GCDWebServerResponse(statusCode: 403)
                    }
                }
                
                // 2. Resolve requested path (SPA fallback support)
                var resolvedPath = requestedPath
                if resolvedPath == "/" || !resolvedPath.contains(".") {
                    resolvedPath = "/index.html"
                }
                
                let resolvedURL = URL(fileURLWithPath: self.basePath).appendingPathComponent(resolvedPath).standardized
                let baseURL = URL(fileURLWithPath: self.basePath).standardized
                
                // 3. Path Traversal Protection
                guard resolvedURL.path.hasPrefix(baseURL.path) else {
                    print("[Security] Blocked path traversal attempt: \(requestedPath)")
                    return GCDWebServerResponse(statusCode: 403)
                }
                
                let filePath = resolvedURL.path
                guard FileManager.default.fileExists(atPath: filePath) else {
                    // Fallback to index.html for SPA router support
                    let indexURL = URL(fileURLWithPath: self.basePath).appendingPathComponent("index.html").standardized
                    if FileManager.default.fileExists(atPath: indexURL.path) {
                        let response = GCDWebServerFileResponse(file: indexURL.path, byteRange: request.byteRange)
                        response?.contentType = "text/html"
                        return response
                    }
                    return GCDWebServerResponse(statusCode: 404)
                }
                
                // 4. Instantiate response and set proper MIME types
                let response = GCDWebServerFileResponse(file: filePath, byteRange: request.byteRange)
                let fileExtension = resolvedURL.pathExtension.lowercased()
                if fileExtension == "wasm" {
                    response?.contentType = "application/wasm"
                } else if fileExtension == "js" {
                    response?.contentType = "application/javascript"
                } else if fileExtension == "css" {
                    response?.contentType = "text/css"
                } else if fileExtension == "html" {
                    response?.contentType = "text/html"
                }
                
                return response
            }
        )

        print("[iOSWebServer] Secure server configured for: \(basePath)")
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

import Foundation

/// Sandboxed FileWrite Plugin verifying container boundaries and blocking path traversals
final class FileWritePlugin: RuntimePlugin, @unchecked Sendable {
    var descriptor: PluginDescriptor {
        return PluginDescriptor(
            action: "fs.write",
            permission: .filesystem,
            policy: .protected
        ) { [weak self] action, payload, bundlePath, completion in
            guard let self = self else { return }
            Task {
                let response = await self.handle(BridgeRequest(
                    appId: payload["appId"] as? String ?? "",
                    action: action,
                    payload: payload,
                    bundlePath: bundlePath
                ))
                if response.success {
                    completion(.success(response.data))
                } else {
                    completion(.failure(NSError(
                        domain: "FileSystemPlugin",
                        code: 400,
                        userInfo: [NSLocalizedDescriptionKey: response.errorMessage ?? "Error"]
                    )))
                }
            }
        }
    }
    
    func handle(_ request: BridgeRequest) async -> BridgeResponse {
        return await FileSystemHelper.shared.handle(request)
    }
}

/// Sandboxed FileRead Plugin verifying container boundaries and blocking path traversals
final class FileReadPlugin: RuntimePlugin, @unchecked Sendable {
    var descriptor: PluginDescriptor {
        return PluginDescriptor(
            action: "fs.read",
            permission: .filesystem,
            policy: .protected
        ) { [weak self] action, payload, bundlePath, completion in
            guard let self = self else { return }
            Task {
                let response = await self.handle(BridgeRequest(
                    appId: payload["appId"] as? String ?? "",
                    action: action,
                    payload: payload,
                    bundlePath: bundlePath
                ))
                if response.success {
                    completion(.success(response.data))
                } else {
                    completion(.failure(NSError(
                        domain: "FileSystemPlugin",
                        code: 400,
                        userInfo: [NSLocalizedDescriptionKey: response.errorMessage ?? "Error"]
                    )))
                }
            }
        }
    }
    
    func handle(_ request: BridgeRequest) async -> BridgeResponse {
        return await FileSystemHelper.shared.handle(request)
    }
}

/// Shared Helper for Sandboxed Filesystem operations
final class FileSystemHelper {
    static let shared = FileSystemHelper()
    
    private init() {}
    
    func handle(_ request: BridgeRequest) async -> BridgeResponse {
        let fileManager = FileManager.default
        let appId = request.appId.isEmpty ? "default_app" : request.appId
        
        // 1. Resolve sandbox base path
        let documentsURL = fileManager.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let sandboxBase = documentsURL
            .appendingPathComponent("MiniAppsData", isDirectory: true)
            .appendingPathComponent(appId, isDirectory: true)
            .standardized
            .resolvingSymlinksInPath()
        
        let path = request.payload["path"] as? String ?? ""
        guard !path.isEmpty else {
            return .failure(code: "INVALID_PATH", message: "Missing 'path' parameter.")
        }
        
        // 2. Security Validation: Path Traversal checks
        if path.contains("../") || path.contains("..") {
            return .failure(code: "PATH_TRAVERSAL_ATTEMPT", message: "Relative path components '..' are forbidden.")
        }
        
        if path.hasPrefix("/") {
            return .failure(code: "ABSOLUTE_PATH_REJECTED", message: "Absolute paths are forbidden.")
        }
        
        let targetURL = sandboxBase.appendingPathComponent(path).standardized.resolvingSymlinksInPath()
        
        let canonicalSandbox = sandboxBase.standardized.resolvingSymlinksInPath().path
        let canonicalTarget = targetURL.standardized.resolvingSymlinksInPath().path
        
        // Ensure path does not escape sandbox container prefix
        guard canonicalTarget.hasPrefix(canonicalSandbox) else {
            return .failure(code: "SANDBOX_ESCAPE_REJECTED", message: "Path escapes the App Sandbox container.")
        }
        
        do {
            try fileManager.createDirectory(at: sandboxBase, withIntermediateDirectories: true, attributes: nil)
            
            if request.action == "fs.write" {
                let content = request.payload["content"] as? String ?? ""
                let additionalBytes = Int64(content.data(using: .utf8)?.count ?? 0)
                if let quotaError = ResourceGovernor().validateFilesystemWrite(appId: appId, additionalBytes: additionalBytes) {
                    return .failure(code: quotaError.code.rawValue, message: quotaError.message)
                }

                let targetDir = targetURL.deletingLastPathComponent()
                try fileManager.createDirectory(at: targetDir, withIntermediateDirectories: true, attributes: nil)
                try content.write(to: targetURL, atomically: true, encoding: .utf8)
                return .success(["written": true])
            } else if request.action == "fs.read" {
                guard fileManager.fileExists(atPath: targetURL.path) else {
                    return .failure(code: "FILE_NOT_FOUND", message: "File does not exist at requested path.")
                }
                let content = try String(contentsOf: targetURL, encoding: .utf8)
                return .success(["content": content])
            }
            
            return .failure(code: "UNKNOWN_ACTION", message: "Unsupported FileSystem action.")
        } catch {
            return .failure(code: "IO_ERROR", message: error.localizedDescription)
        }
    }
}

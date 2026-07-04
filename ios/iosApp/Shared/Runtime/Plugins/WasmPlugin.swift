import Foundation

/// Wasm Execution Plugin mapping wasm.execute calls to WasmExecutor
final class WasmExecutePlugin: RuntimePlugin, @unchecked Sendable {
    var descriptor: PluginDescriptor {
        return PluginDescriptor(
            action: "wasm.execute",
            permission: .wasm,
            policy: .protected
        ) { [weak self] action, payload, bundlePath, completion in
            guard let self = self else { return }
            Task {
                let response = await self.handle(BridgeRequest(
                    appId: "",
                    action: action,
                    payload: payload,
                    bundlePath: bundlePath
                ))
                if response.success {
                    completion(.success(response.data))
                } else {
                    completion(.failure(NSError(
                        domain: "WasmPlugin",
                        code: 400,
                        userInfo: [NSLocalizedDescriptionKey: response.errorMessage ?? "Error"]
                    )))
                }
            }
        }
    }
    
    func handle(_ request: BridgeRequest) async -> BridgeResponse {
        return await WasmHelper.shared.handle(request)
    }
}

/// PluginInvoke Plugin mapping plugin.invoke calls to their handlers
final class PluginInvokePlugin: RuntimePlugin, @unchecked Sendable {
    var descriptor: PluginDescriptor {
        return PluginDescriptor(
            action: "plugin.invoke",
            permission: nil,
            policy: .open
        ) { [weak self] action, payload, bundlePath, completion in
            guard let self = self else { return }
            Task {
                let response = await self.handle(BridgeRequest(
                    appId: "",
                    action: action,
                    payload: payload,
                    bundlePath: bundlePath
                ))
                if response.success {
                    completion(.success(response.data))
                } else {
                    completion(.failure(NSError(
                        domain: "WasmPlugin",
                        code: 400,
                        userInfo: [NSLocalizedDescriptionKey: response.errorMessage ?? "Error"]
                    )))
                }
            }
        }
    }
    
    func handle(_ request: BridgeRequest) async -> BridgeResponse {
        return await WasmHelper.shared.handle(request)
    }
}

/// Helper manager coordinating Wasm logic execution
final class WasmHelper {
    static let shared = WasmHelper()
    
    private init() {}
    
    func handle(_ request: BridgeRequest) async -> BridgeResponse {
        let action = request.action
        let payload = request.payload
        let bundlePath = request.bundlePath
        
        if action == "wasm.execute" {
            let wasmFile = payload["wasmPath"] as? String ?? payload["wasmFile"] as? String ?? ""
            let functionName = payload["functionName"] as? String ?? payload["method"] as? String ?? ""
            let args = payload["args"] as? [Any] ?? []
            
            guard !wasmFile.isEmpty else {
                return .failure(code: "INVALID_ARGUMENTS", message: "Missing 'wasmPath' parameter.")
            }
            guard !functionName.isEmpty else {
                return .failure(code: "INVALID_ARGUMENTS", message: "Missing 'functionName' parameter.")
            }
            
            let localWasmURL = bundlePath.appendingPathComponent(wasmFile)
            guard FileManager.default.fileExists(atPath: localWasmURL.path) else {
                return .failure(code: "WASM_NOT_FOUND", message: "Wasm file not found: \(wasmFile)")
            }
            if let quotaError = ResourceGovernor().validateWasmFile(path: localWasmURL.path) {
                return .failure(code: quotaError.code.rawValue, message: quotaError.message)
            }
            
            do {
                let results = try await WasmExecutor.shared.execute(
                    wasmPath: localWasmURL.path,
                    functionName: functionName,
                    args: args
                )
                return .success(["results": results])
            } catch {
                return .failure(code: "WASM_EXECUTION_ERROR", message: error.localizedDescription)
            }
        } else if action == "plugin.invoke" {
            let plugin = payload["plugin"] as? String ?? ""
            let method = payload["method"] as? String ?? ""
            let args = payload["args"] as? [String: Any] ?? [:]
            
            if plugin == "wasm" {
                let wasmFile = args["wasmPath"] as? String ?? ""
                let functionName = method
                let wasmArgs = args["args"] as? [Any] ?? []
                
                guard !wasmFile.isEmpty else {
                    return .failure(code: "INVALID_ARGUMENTS", message: "Missing 'wasmPath' in args.")
                }
                
                let localWasmURL = bundlePath.appendingPathComponent(wasmFile)
                guard FileManager.default.fileExists(atPath: localWasmURL.path) else {
                    return .failure(code: "WASM_NOT_FOUND", message: "Wasm file not found: \(wasmFile)")
                }
                if let quotaError = ResourceGovernor().validateWasmFile(path: localWasmURL.path) {
                    return .failure(code: quotaError.code.rawValue, message: quotaError.message)
                }
                
                do {
                    let results = try await WasmExecutor.shared.execute(
                        wasmPath: localWasmURL.path,
                        functionName: functionName,
                        args: wasmArgs
                    )
                    return .success(["results": results])
                } catch {
                    return .failure(code: "WASM_EXECUTION_ERROR", message: error.localizedDescription)
                }
            } else {
                return .failure(code: "UNKNOWN_PLUGIN", message: "Plugin '\(plugin)' is not registered for plugin.invoke.")
            }
        }
        
        return .failure(code: "UNKNOWN_ACTION", message: "Unsupported wasm action.")
    }
}

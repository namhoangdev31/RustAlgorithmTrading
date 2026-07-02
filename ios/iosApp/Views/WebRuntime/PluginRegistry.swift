import Foundation
import UIKit

/// Descriptor defining a bridge plugin's action, permission requirements, and implementation handler
struct PluginDescriptor {
    let action: String
    let permission: Permission?
    let policy: Policy
    let handler: (String, [String: Any], URL, @escaping (Result<[String: Any]?, Error>) -> Void) -> Void
}

/// Dynamic Decoupled registry managing native plugin execution handlers and ACL policy mapping rules
final class PluginRegistry {
    static let shared = PluginRegistry()
    
    private var plugins: [String: PluginDescriptor] = [:]
    private let lock = NSLock()
    
    private init() {
        registerBuiltInPlugins()
    }
    
    /// Registers a new plugin descriptor in the registry
    func register(plugin: PluginDescriptor) {
        lock.lock()
        defer { lock.unlock() }
        plugins[plugin.action] = plugin
    }
    
    /// Queries the permission rule for a given action and payload
    func getRule(forAction action: String, payload: [String: Any]) -> BridgePermissionRule? {
        lock.lock()
        defer { lock.unlock() }
        
        // Dynamic check for plugin.invoke action
        if action == "plugin.invoke" {
            let pluginName = payload["plugin"] as? String ?? ""
            if pluginName == "wasm" {
                return BridgePermissionRule(action: "plugin.invoke", permission: .wasm, policy: .protected)
            }
            return BridgePermissionRule(action: "plugin.invoke", permission: nil, policy: .open)
        }
        
        guard let desc = plugins[action] else { return nil }
        return BridgePermissionRule(action: desc.action, permission: desc.permission, policy: desc.policy)
    }
    
    /// Executes the registered plugin action handler asynchronously
    func execute(
        action: String,
        payload: [String: Any],
        bundlePath: URL,
        completion: @escaping (Result<[String: Any]?, Error>) -> Void
    ) {
        let descriptor: PluginDescriptor?
        lock.lock()
        descriptor = plugins[action]
        lock.unlock()
        
        guard let desc = descriptor else {
            let error = NSError(
                domain: "PluginRegistry",
                code: 404,
                userInfo: [NSLocalizedDescriptionKey: "Action '\(action)' handler not registered in registry."]
            )
            completion(.failure(error))
            return
        }
        
        desc.handler(action, payload, bundlePath, completion)
    }
    
    private func registerBuiltInPlugins() {
        register(plugin: HapticsPlugin().descriptor)
        register(plugin: CameraPlugin().descriptor)
        register(plugin: LocationPlugin().descriptor)
        register(plugin: SharePlugin().descriptor)
        register(plugin: FileWritePlugin().descriptor)
        register(plugin: FileReadPlugin().descriptor)
        register(plugin: ClipboardSetPlugin().descriptor)
        register(plugin: ClipboardGetPlugin().descriptor)
        register(plugin: WasmExecutePlugin().descriptor)
        register(plugin: PluginInvokePlugin().descriptor)
    }
}

/// Helper Rule holding security verification metadata for ACL
struct BridgePermissionRule {
    let action: String
    let permission: Permission?
    let policy: Policy
}

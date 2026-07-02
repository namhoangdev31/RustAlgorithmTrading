import Foundation
import UIKit

/// Descriptor defining a bridge plugin's action, permission requirements, and implementation handler
struct BridgeRateLimitPolicy {
    let windowSeconds: TimeInterval
    let maxCalls: Int
}

struct PluginDescriptor {
    let id: String
    let actions: [String]
    let permission: Permission?
    let policy: Policy
    let requiresUserGesture: Bool
    let rateLimit: BridgeRateLimitPolicy?
    let handler: (String, [String: Any], URL, @escaping (Result<[String: Any]?, Error>) -> Void) -> Void

    var action: String { actions.first ?? id }

    init(
        action: String,
        permission: Permission?,
        policy: Policy,
        requiresUserGesture: Bool = false,
        rateLimit: BridgeRateLimitPolicy? = nil,
        handler: @escaping (String, [String: Any], URL, @escaping (Result<[String: Any]?, Error>) -> Void) -> Void
    ) {
        self.id = action
        self.actions = [action]
        self.permission = permission
        self.policy = policy
        self.requiresUserGesture = requiresUserGesture
        self.rateLimit = rateLimit
        self.handler = handler
    }

    init(
        id: String,
        actions: [String],
        permission: Permission?,
        policy: Policy,
        requiresUserGesture: Bool = false,
        rateLimit: BridgeRateLimitPolicy? = nil,
        handler: @escaping (String, [String: Any], URL, @escaping (Result<[String: Any]?, Error>) -> Void) -> Void
    ) {
        self.id = id
        self.actions = actions
        self.permission = permission
        self.policy = policy
        self.requiresUserGesture = requiresUserGesture
        self.rateLimit = rateLimit
        self.handler = handler
    }
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
        for action in plugin.actions {
            plugins[action] = plugin
        }
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

    func getDescriptor(forAction action: String, payload: [String: Any]) -> PluginDescriptor? {
        lock.lock()
        defer { lock.unlock() }
        return plugins[action]
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

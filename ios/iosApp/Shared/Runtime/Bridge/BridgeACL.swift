import Foundation

/// Bridge Access Control List (ACL) resolving required permissions from the PluginRegistry
struct BridgeACL {
    /// Resolves required permission for a given action and payload via PluginRegistry rules.
    /// Returns nil if policy is open.
    static func requiredPermission(forAction action: String, payload: [String: Any]) -> Permission? {
        guard let rule = PluginRegistry.shared.getRule(forAction: action, payload: payload) else {
            return nil
        }
        return rule.policy == .protected ? rule.permission : nil
    }
}

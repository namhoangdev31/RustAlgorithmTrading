import Foundation

/// Thread-safe Rate Limiter enforcing call limits (vibrate: 5/10s, wasm: 20/min) using sliding window
final class BridgeRateLimiter {
    static let shared = BridgeRateLimiter()
    
    private var callHistory: [String: [Date]] = [:] // Key is "appId:action"
    private let lock = NSLock()
    
    private init() {}
    
    /// Validates if an action is within rate limits.
    func isAllowed(appId: String, tabId: UUID, action: String, policy: BridgeRateLimitPolicy? = nil) -> Bool {
        lock.lock()
        defer { lock.unlock() }
        
        let limitSeconds: TimeInterval
        let maxCalls: Int
        
        // Rate limit rules
        if let policy {
            limitSeconds = policy.windowSeconds
            maxCalls = policy.maxCalls
        } else if action == "vibrate" {
            limitSeconds = 10.0
            maxCalls = 5
        } else if action == "wasm.execute" {
            limitSeconds = 60.0
            maxCalls = 20
        } else {
            // General safety buffer limit for all other calls
            limitSeconds = 60.0
            maxCalls = 100
        }
        
        let key = "\(appId):\(tabId.uuidString):\(action)"
        let now = Date()
        
        // Filter timestamps falling inside the window limit
        var history = callHistory[key] ?? []
        history = history.filter { now.timeIntervalSince($0) <= limitSeconds }
        
        if history.count >= maxCalls {
            print("[RateLimiter] Rejected spammed call for \(key). Maximum \(maxCalls) calls in \(limitSeconds)s allowed.")
            return false
        }
        
        history.append(now)
        callHistory[key] = history
        return true
    }
}

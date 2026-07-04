import Foundation

/// Internal System Events emitted by runtime core services
enum RuntimeEvent: Sendable {
    case miniAppInstalled(appId: String, version: String)
    case miniAppUpdated(appId: String, version: String)
    case tabOpened(tabId: UUID, appId: String)
    case tabClosed(tabId: UUID, appId: String)
    case tabSuspended(tabId: UUID, appId: String)
    case permissionGranted(appId: String, permission: String)
    case permissionDenied(appId: String, permission: String)
    case bridgeError(appId: String, action: String, error: String)
    case processKilled(appId: String, tabId: UUID)
    case rollbackTriggered(appId: String, failedVersion: String, fallbackVersion: String)
    case otaInstalled(appId: String, version: String)
    case quotaExceeded(appId: String, detail: String)
}

/// Actor-based concurrency-safe Publish-Subscribe Event Bus for system events
actor RuntimeEventBus {
    static let shared = RuntimeEventBus()
    
    private var subscribers: [UUID: @Sendable (RuntimeEvent) -> Void] = [:]
    
    private init() {}
    
    /// Publishes a RuntimeEvent to all registered subscribers asynchronously
    func publish(_ event: RuntimeEvent) {
        for subscriber in subscribers.values {
            subscriber(event)
        }
    }
    
    /// Subscribes to runtime events, returning an unsubscriber token
    @discardableResult
    func subscribe(_ subscriber: @escaping @Sendable (RuntimeEvent) -> Void) -> UUID {
        let id = UUID()
        subscribers[id] = subscriber
        return id
    }
    
    /// Unsubscribes from events using the subscriber token
    func unsubscribe(token: UUID) {
        subscribers.removeValue(forKey: token)
    }
}

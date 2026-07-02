import Foundation

/// A thread-safe global registry mapping Tab ID (UUID) to iOSWebServer instances.
/// Allows unified server lifetime management during lifecycle transitions.
final class ServerRegistry {
    static let shared = ServerRegistry()
    
    private var servers: [UUID: iOSWebServer] = [:]
    private let queue = DispatchQueue(label: "com.antigravity.serverregistry.queue", attributes: .concurrent)
    
    private init() {}
    
    func register(id: UUID, server: iOSWebServer) {
        queue.async(flags: .barrier) {
            self.servers[id] = server
        }
    }
    
    func remove(id: UUID) {
        queue.async(flags: .barrier) {
            self.servers.removeValue(forKey: id)
        }
    }
    
    func get(id: UUID) -> iOSWebServer? {
        queue.sync {
            self.servers[id]
        }
    }
    
    func stop(id: UUID) {
        queue.sync {
            if let server = self.servers[id] {
                server.stop()
            }
        }
        queue.async(flags: .barrier) {
            self.servers.removeValue(forKey: id)
        }
    }
    
    func stopAll() {
        queue.sync {
            for server in self.servers.values {
                server.stop()
            }
        }
        queue.async(flags: .barrier) {
            self.servers.removeAll()
        }
    }
}

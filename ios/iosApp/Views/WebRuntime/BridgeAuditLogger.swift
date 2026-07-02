import Foundation

/// Asynchronous Thread-safe logger recording sensitive bridge calls to console audit logs
final class BridgeAuditLogger {
    static let shared = BridgeAuditLogger()
    
    private let queue = DispatchQueue(label: "com.antigravity.auditlogger", qos: .background)
    private let lock = NSLock()
    private var loggedCalls: Int = 0

    var totalLoggedCalls: Int {
        lock.lock()
        defer { lock.unlock() }
        return loggedCalls
    }
    
    private init() {}
    
    /// Records an execution log of a sensitive bridge call
    func logCall(
        appId: String,
        action: String,
        permission: String?,
        success: Bool,
        errorCode: String? = nil,
        errorMessage: String? = nil
    ) {
        lock.lock()
        loggedCalls += 1
        lock.unlock()

        queue.async {
            let timestamp = Date().timeIntervalSince1970
            let logMsg = """
            [BridgeAuditLog]
              Timestamp: \(timestamp)
              App ID   : \(appId)
              Action   : \(action)
              Perm     : \(permission ?? "none")
              Status   : \(success ? "SUCCESS" : "FAILED")
              ErrCode  : \(errorCode ?? "none")
              ErrDesc  : \(errorMessage ?? "none")
            """
            print(logMsg)

            do {
                try MiniAppDatabase.shared.write { db in
                    try db.execute(sql: """
                        INSERT INTO bridge_audit_logs (app_id, action, permission, success, error_code, error_message, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, arguments: [appId, action, permission, success, errorCode, errorMessage, Date()])
                }
            } catch {
                print("[BridgeAuditLogger] SQLite audit persistence failed: \(error.localizedDescription)")
            }
        }
    }
}

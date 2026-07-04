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

            Task {
                await DatabaseService.shared.logBridgeCall(
                    appId: appId,
                    action: action,
                    permission: permission,
                    success: success,
                    errorCode: errorCode,
                    errorMessage: errorMessage
                )
            }
        }
    }
}

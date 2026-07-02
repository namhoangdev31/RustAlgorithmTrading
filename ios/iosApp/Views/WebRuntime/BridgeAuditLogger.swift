import Foundation

/// Asynchronous Thread-safe logger recording sensitive bridge calls to console audit logs
final class BridgeAuditLogger {
    static let shared = BridgeAuditLogger()
    
    private let queue = DispatchQueue(label: "com.antigravity.auditlogger", qos: .background)
    
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
        }
    }
}

import Foundation

/// Incoming JS bridge request metadata bundle package
struct BridgeRequest {
    let appId: String
    let action: String
    let payload: [String: Any]
    let bundlePath: URL
}

/// Outgoing standardized JS bridge response
struct BridgeResponse {
    let success: Bool
    let data: [String: Any]?
    let errorCode: String?
    let errorMessage: String?
    
    static func success(_ data: [String: Any]? = nil) -> BridgeResponse {
        return BridgeResponse(success: true, data: data, errorCode: nil, errorMessage: nil)
    }
    
    static func failure(code: String, message: String) -> BridgeResponse {
        return BridgeResponse(success: false, data: nil, errorCode: code, errorMessage: message)
    }
}

/// Giao thức chung cho mọi Native Plugin trên hệ thống Super App Engine
protocol RuntimePlugin {
    var descriptor: PluginDescriptor { get }
    func handle(_ request: BridgeRequest) async -> BridgeResponse
}

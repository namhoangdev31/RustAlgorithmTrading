import Foundation

/// Stable ABI Permission Contract
enum ABIPermission: String, Codable, Sendable {
    case camera
    case location
    case notification
    case microphone
    case contacts
    case biometrics
    case bluetooth
    case photosPicker
    case photosAddOnly
    case filesystem
    case wasm
}

/// Stable ABI Security Policy Contract
enum ABIPolicy: String, Codable, Sendable {
    case open
    case protected
    case internalOnly
}

/// Stable ABI Manifest Contract
struct ABIManifest: Codable, Sendable {
    let id: String
    let name: String
    let version: String
    let minRuntimeVersion: String?
    let maxRuntimeVersion: String?
    let capabilities: [String]?
}

/// Stable ABI Bridge Request Package
struct ABIBridgeRequest: @unchecked Sendable {
    let appId: String
    let action: String
    let payload: [String: Any]
    let bundlePath: URL
}

/// Stable ABI Bridge Response Package
struct ABIBridgeResponse: @unchecked Sendable {
    let success: Bool
    let data: [String: Any]?
    let errorCode: String?
    let errorMessage: String?
}

/// Adapter utility converting between legacy internal structures and the stable ABI contract
struct RuntimeABI {
    static func adapt(_ req: BridgeRequest) -> ABIBridgeRequest {
        return ABIBridgeRequest(
            appId: req.appId,
            action: req.action,
            payload: req.payload,
            bundlePath: req.bundlePath
        )
    }
    
    static func adapt(_ res: ABIBridgeResponse) -> BridgeResponse {
        return BridgeResponse(
            success: res.success,
            data: res.data,
            errorCode: res.errorCode,
            errorMessage: res.errorMessage
        )
    }
    
    static func adapt(_ req: ABIBridgeRequest) -> BridgeRequest {
        return BridgeRequest(
            appId: req.appId,
            action: req.action,
            payload: req.payload,
            bundlePath: req.bundlePath
        )
    }
    
    static func adapt(_ res: BridgeResponse) -> ABIBridgeResponse {
        return ABIBridgeResponse(
            success: res.success,
            data: res.data,
            errorCode: res.errorCode,
            errorMessage: res.errorMessage
        )
    }
}

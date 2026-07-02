import Foundation

/// Phân loại loại quyền trong Runtime
enum PermissionKind: String, Codable, Sendable {
    case system
    case runtime
}

/// Trạng thái quyền chuẩn hóa trong iOS & Runtime Shell
enum RuntimePermissionStatus: String, Codable, Sendable {
    case granted
    case denied
    case notDetermined
    case restricted
    case limited
    case unavailable
    case notEnrolled
    case lockedOut
}

/// Mã lỗi phân loại rõ ràng cho JS Bridge
enum PermissionErrorCode: String, Codable, Sendable {
    case permissionNotDeclared
    case permissionDeniedByShell
    case permissionDeniedBySystem
    case permissionRestrictedBySystem
    case permissionUnavailable
    case pluginUnavailable
    case userGestureRequired
}

/// Kết quả chi tiết trả về cho JS Bridge
struct PermissionResult: Codable, Sendable {
    let permission: Permission
    let status: RuntimePermissionStatus
    let code: PermissionErrorCode?
    let required: Bool
}

/// Quyết định cấp quyền của người dùng dành cho Mini App trên Shell
enum ShellDecision: String, Codable, Sendable {
    case approved
    case denied
    case notAsked
}

/// Security permissions that a Mini App can request
enum Permission: String, Codable, CaseIterable, Sendable {
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
    
    var kind: PermissionKind {
        switch self {
        case .filesystem, .wasm, .photosPicker:
            return .runtime
        default:
            return .system
        }
    }
}

/// Dynamic permission state on iOS matching system states (Deprecated in favor of RuntimePermissionStatus)
enum PermissionState: String, Codable {
    case granted
    case denied
    case notDetermined
    case restricted
}

/// Access policies for JS Bridge actions
enum Policy {
    case open
    case protected
    case internalOnly
}

/// Cấu hình chi tiết cho từng quyền được yêu cầu trong manifest
struct ManifestPermission: Codable, Hashable {
    let reason: String
    let required: Bool
}

/// Standardized Mini App configuration manifest model
struct WebRuntimeManifest: Hashable, Codable {
    let id: String
    let version: String
    let name: String
    let entry: String
    let type: String
    let orientation: String
    let fullScreen: Bool
    var permissions: [String: ManifestPermission]? = nil
    var minRuntimeVersion: String? = nil
    var maxRuntimeVersion: String? = nil
    var dependencies: [String: String]? = nil
    
    func permissionConfig(for permission: Permission) -> ManifestPermission? {
        permissions?[permission.rawValue]
    }
}

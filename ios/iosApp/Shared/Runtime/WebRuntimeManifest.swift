import Foundation

/// Security permissions that a Mini App can request
enum Permission: String, Codable, CaseIterable {
    case camera
    case location
    case filesystem
    case wasm
    case notification
}

/// Dynamic permission state on iOS matching system states
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

/// A specific permission requested in the manifest with an explaining reason
struct ManifestPermission: Codable, Hashable {
    let name: String
    let reason: String
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
    var permissions: [ManifestPermission]? = nil
}

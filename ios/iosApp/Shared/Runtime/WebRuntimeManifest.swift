import Foundation

struct WebRuntimeManifest: Hashable, Codable {
    let id: String
    let version: String
    let name: String
    let entry: String
    let type: String
    let orientation: String
    let fullScreen: Bool
}

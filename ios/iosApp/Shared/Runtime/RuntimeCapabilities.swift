import Foundation
import UIKit
import CoreLocation

enum CapabilitySupport: String, Codable {
    case native
    case proxy
    case unsupported
}

struct RuntimeCapabilities: Codable {
    let bluetooth: CapabilitySupport
    let nfc: CapabilitySupport
    let biometrics: CapabilitySupport
    let share: CapabilitySupport
    let vibrate: CapabilitySupport
    let clipboard: CapabilitySupport
    let camera: CapabilitySupport
    let geolocation: CapabilitySupport
    let wasm: CapabilitySupport
    let filesystem: CapabilitySupport
    let ota: CapabilitySupport
    let backgroundTask: CapabilitySupport

    static var current: RuntimeCapabilities {
        PlatformCapabilities.getCapabilities()
    }

    func supports(capability: String) -> Bool {
        switch capability {
        case "camera": return camera != .unsupported
        case "location", "geolocation": return geolocation != .unsupported
        case "share": return share != .unsupported
        case "vibrate": return vibrate != .unsupported
        case "clipboard": return clipboard != .unsupported
        case "biometrics": return biometrics != .unsupported
        case "bluetooth": return bluetooth != .unsupported
        case "nfc": return nfc != .unsupported
        case "wasm": return wasm != .unsupported
        case "filesystem": return filesystem != .unsupported
        case "ota": return ota != .unsupported
        case "backgroundTask": return backgroundTask != .unsupported
        default: return false
        }
    }

    func toJson() -> String {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        guard let data = try? encoder.encode(self) else { return "{}" }
        return String(data: data, encoding: .utf8) ?? "{}"
    }
}

enum PlatformCapabilities {
    static func getCapabilities() -> RuntimeCapabilities {
        RuntimeCapabilities(
            bluetooth: .unsupported,
            nfc: .unsupported,
            biometrics: .native,
            share: .native,
            vibrate: .native,
            clipboard: .native,
            camera: UIImagePickerController.isSourceTypeAvailable(.camera) ? .native : .unsupported,
            geolocation: CLLocationManager.locationServicesEnabled() ? .native : .unsupported,
            wasm: .native,
            filesystem: .native,
            ota: .native,
            backgroundTask: .native
        )
    }
}

enum WebRuntimeState {
    case idle
    case loading
    case ready(bundlePath: String)
    case error(message: String)
}

final class GestureValidator {
    private let gestureWindowSeconds: TimeInterval
    private var lastGestureTimestamp: TimeInterval = 0

    init(gestureWindowSeconds: TimeInterval = 5.0) {
        self.gestureWindowSeconds = gestureWindowSeconds
    }

    func recordGesture() {
        lastGestureTimestamp = Date().timeIntervalSince1970
    }

    func hasValidGesture() -> Bool {
        Date().timeIntervalSince1970 - lastGestureTimestamp < gestureWindowSeconds
    }

    func reset() {
        lastGestureTimestamp = 0
    }
}

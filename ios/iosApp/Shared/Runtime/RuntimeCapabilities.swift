import Foundation

// MARK: - Runtime Capabilities (replaces KMP CapabilityDiscovery)

enum CapabilitySupport: String {
    case native
    case proxy
    case unsupported
}

struct RuntimeCapabilities {
    let bluetooth: CapabilitySupport
    let nfc: CapabilitySupport
    let biometrics: CapabilitySupport
    let share: CapabilitySupport
    let vibrate: CapabilitySupport
    let clipboard: CapabilitySupport
    let camera: CapabilitySupport
    let geolocation: CapabilitySupport
    
    func toJson() -> String {
        return """
        {
            "bluetooth": "\(bluetooth.rawValue)",
            "nfc": "\(nfc.rawValue)",
            "biometrics": "\(biometrics.rawValue)",
            "share": "\(share.rawValue)",
            "vibrate": "\(vibrate.rawValue)",
            "clipboard": "\(clipboard.rawValue)",
            "camera": "\(camera.rawValue)",
            "geolocation": "\(geolocation.rawValue)"
        }
        """
    }
}

enum PlatformCapabilities {
    static func getCapabilities() -> RuntimeCapabilities {
        return RuntimeCapabilities(
            bluetooth: .unsupported,
            nfc: .unsupported,
            biometrics: .native,       // iOS Face ID / Touch ID
            share: .native,            // UIActivityViewController
            vibrate: .native,          // UIFeedbackGenerator
            clipboard: .native,        // UIPasteboard
            camera: .unsupported,
            geolocation: .unsupported
        )
    }
}

// MARK: - Web Runtime State (replaces KMP WebRuntimeState)

enum WebRuntimeState {
    case idle
    case loading
    case ready(bundlePath: String)
    case error(message: String)
}

// MARK: - Gesture Validator (replaces KMP GestureValidator)

class GestureValidator {
    private let gestureWindowMs: TimeInterval
    private var lastGestureTimestamp: TimeInterval = 0
    
    init(gestureWindowMs: TimeInterval = 5.0) {
        self.gestureWindowMs = gestureWindowMs
    }
    
    func recordGesture() {
        lastGestureTimestamp = Date().timeIntervalSince1970
    }
    
    func hasValidGesture() -> Bool {
        let elapsed = Date().timeIntervalSince1970 - lastGestureTimestamp
        return elapsed < gestureWindowMs
    }
    
    func reset() {
        lastGestureTimestamp = 0
    }
}

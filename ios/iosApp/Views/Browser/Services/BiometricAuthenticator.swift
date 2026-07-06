import Foundation
import LocalAuthentication

@MainActor
public struct BiometricAuthenticator {
    public static func authenticate(reason: String, completion: @escaping (Bool) -> Void) {
        let context = LAContext()
        var error: NSError?
        
        // Support biometric authentication or fallback to device passcode
        if context.canEvaluatePolicy(.deviceOwnerAuthentication, error: &error) {
            context.evaluatePolicy(.deviceOwnerAuthentication, localizedReason: reason) { success, _ in
                DispatchQueue.main.async {
                    completion(success)
                }
            }
        } else {
            // If the simulator or device has no passcode/biometrics set up, succeed by default
            completion(true)
        }
    }
}

import Foundation
import LocalAuthentication

final class BiometricsPlugin: RuntimePlugin, @unchecked Sendable {
    var descriptor: PluginDescriptor {
        return PluginDescriptor(
            action: "biometrics.authenticate",
            permission: .biometrics,
            policy: .protected
        ) { [weak self] action, payload, bundlePath, completion in
            guard let self = self else { return }
            Task {
                let response = await self.handle(BridgeRequest(
                    appId: payload["appId"] as? String ?? "",
                    action: action,
                    payload: payload,
                    bundlePath: bundlePath
                ))
                if response.success {
                    completion(.success(response.data))
                } else {
                    completion(.failure(NSError(
                        domain: "BiometricsPlugin",
                        code: 400,
                        userInfo: [NSLocalizedDescriptionKey: response.errorMessage ?? "Error"]
                    )))
                }
            }
        }
    }

    func handle(_ request: BridgeRequest) async -> BridgeResponse {
        let payload = request.payload
        let context = LAContext()
        var error: NSError?

        // 1. Verify if biometric authentication is available on device
        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
            return .failure(
                code: "BIOMETRICS_UNAVAILABLE",
                message: error?.localizedDescription ?? "Face ID or Touch ID is not configured or available."
            )
        }

        // 2. Fetch the dynamic localized reason from the request payload
        let reason = payload["reason"] as? String ?? "Xác thực danh tính truy cập tính năng giao dịch Lepos."

        return await withCheckedContinuation { continuation in
            context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, localizedReason: reason) { success, evaluateError in
                if success {
                    continuation.resume(returning: .success([
                        "authenticated": true
                    ]))
                } else {
                    let errMsg = evaluateError?.localizedDescription ?? "Biometric authentication failed."
                    continuation.resume(returning: .failure(
                        code: "AUTHENTICATION_FAILED",
                        message: errMsg
                    ))
                }
            }
        }
    }
}

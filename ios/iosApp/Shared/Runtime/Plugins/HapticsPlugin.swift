import Foundation
import UIKit

/// Standardized Haptic vibration feedback plugin conforming to RuntimePlugin
final class HapticsPlugin: RuntimePlugin, @unchecked Sendable {
    var descriptor: PluginDescriptor {
        return PluginDescriptor(
            action: "vibrate",
            permission: nil,
            policy: .open
        ) { [weak self] action, payload, bundlePath, completion in
            guard let self = self else { return }
            Task {
                let response = await self.handle(BridgeRequest(
                    appId: "",
                    action: action,
                    payload: payload,
                    bundlePath: bundlePath
                ))
                if response.success {
                    completion(.success(response.data))
                } else {
                    completion(.failure(NSError(
                        domain: "HapticsPlugin",
                        code: 400,
                        userInfo: [NSLocalizedDescriptionKey: response.errorMessage ?? "Error"]
                    )))
                }
            }
        }
    }
    
    func handle(_ request: BridgeRequest) async -> BridgeResponse {
        return await withCheckedContinuation { continuation in
            DispatchQueue.main.async {
                let styleString = request.payload["style"] as? String ?? "medium"
                let style: UIImpactFeedbackGenerator.FeedbackStyle
                switch styleString {
                case "light": style = .light
                case "heavy": style = .heavy
                case "soft": style = .soft
                case "rigid": style = .rigid
                default: style = .medium
                }
                
                let generator = UIImpactFeedbackGenerator(style: style)
                generator.prepare()
                generator.impactOccurred()
                
                continuation.resume(returning: .success(["vibrated": true]))
            }
        }
    }
}

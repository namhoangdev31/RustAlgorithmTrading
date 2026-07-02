import Foundation
import UIKit

/// Standardized ClipboardSet Plugin for writing system pasteboard text
final class ClipboardSetPlugin: RuntimePlugin, @unchecked Sendable {
    var descriptor: PluginDescriptor {
        return PluginDescriptor(
            action: "clipboard.set",
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
                        domain: "ClipboardPlugin",
                        code: 400,
                        userInfo: [NSLocalizedDescriptionKey: response.errorMessage ?? "Error"]
                    )))
                }
            }
        }
    }
    
    func handle(_ request: BridgeRequest) async -> BridgeResponse {
        let text = request.payload["text"] as? String ?? ""
        UIPasteboard.general.string = text
        return .success(["copied": true])
    }
}

/// Standardized ClipboardGet Plugin for reading system pasteboard text
final class ClipboardGetPlugin: RuntimePlugin, @unchecked Sendable {
    var descriptor: PluginDescriptor {
        return PluginDescriptor(
            action: "clipboard.get",
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
                        domain: "ClipboardPlugin",
                        code: 400,
                        userInfo: [NSLocalizedDescriptionKey: response.errorMessage ?? "Error"]
                    )))
                }
            }
        }
    }
    
    func handle(_ request: BridgeRequest) async -> BridgeResponse {
        let text = UIPasteboard.general.string ?? ""
        return .success(["text": text])
    }
}

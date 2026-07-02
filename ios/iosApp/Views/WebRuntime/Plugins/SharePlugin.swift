import Foundation
import UIKit

/// Standardized Native Sharing Plugin wrapping UIActivityViewController
final class SharePlugin: RuntimePlugin, @unchecked Sendable {
    var descriptor: PluginDescriptor {
        return PluginDescriptor(
            action: "share.shareText",
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
                        domain: "SharePlugin",
                        code: 400,
                        userInfo: [NSLocalizedDescriptionKey: response.errorMessage ?? "Error"]
                    )))
                }
            }
        }
    }
    
    func handle(_ request: BridgeRequest) async -> BridgeResponse {
        let text = request.payload["text"] as? String ?? ""
        let urlString = request.payload["url"] as? String ?? ""
        
        guard !text.isEmpty || !urlString.isEmpty else {
            return .failure(code: "INVALID_ARGUMENTS", message: "Missing 'text' or 'url' parameters.")
        }
        
        var items: [Any] = []
        if !text.isEmpty { items.append(text) }
        if !urlString.isEmpty, let url = URL(string: urlString) { items.append(url) }
        
        return await withCheckedContinuation { continuation in
            DispatchQueue.main.async { [weak self] in
                guard let self = self else {
                    continuation.resume(returning: .failure(code: "DEALLOCATED", message: "Plugin deallocated."))
                    return
                }
                
                guard let topVC = self.getTopViewController() else {
                    continuation.resume(returning: .failure(code: "UI_ERROR", message: "No active top ViewController found."))
                    return
                }
                
                let shareSheet = UIActivityViewController(activityItems: items, applicationActivities: nil)
                shareSheet.completionWithItemsHandler = { activity, completed, returnedItems, error in
                    continuation.resume(returning: .success(["shared": completed]))
                }
                topVC.present(shareSheet, animated: true)
            }
        }
    }
    
    private func getTopViewController() -> UIViewController? {
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let window = windowScene.windows.first(where: { $0.isKeyWindow }) else {
            return nil
        }
        var topController = window.rootViewController
        while let presented = topController?.presentedViewController {
            topController = presented
        }
        return topController
    }
}

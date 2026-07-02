import Foundation
import AVFoundation

final class CameraPlugin: RuntimePlugin, @unchecked Sendable {
    var descriptor: PluginDescriptor {
        return PluginDescriptor(
            action: "camera.takePhoto",
            permission: .camera,
            policy: .protected
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
                    completion(.failure(NSError(domain: "CameraPlugin", code: 400, userInfo: [NSLocalizedDescriptionKey: response.errorMessage ?? "Error"])))
                }
            }
        }
    }
    
    func handle(_ request: BridgeRequest) async -> BridgeResponse {
        let status = AVCaptureDevice.authorizationStatus(for: .video)
        if status == .denied || status == .restricted {
            return .failure(code: "AV_PERMISSION_DENIED", message: "iOS system Camera capability denied.")
        }
        
        return .success([
            "uri": "https://via.placeholder.com/600x400.png?text=NativeCameraCapture",
            "format": "jpeg",
            "width": 600,
            "height": 400
        ])
    }
}

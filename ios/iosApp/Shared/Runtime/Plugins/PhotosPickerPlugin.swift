import Foundation
import UIKit
import PhotosUI

final class PhotosPickerPlugin: RuntimePlugin, @unchecked Sendable {
    var descriptor: PluginDescriptor {
        return PluginDescriptor(
            action: "photos.pick",
            permission: .photosPicker,
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
                        domain: "PhotosPickerPlugin",
                        code: 400,
                        userInfo: [NSLocalizedDescriptionKey: response.errorMessage ?? "Error"]
                    )))
                }
            }
        }
    }

    func handle(_ request: BridgeRequest) async -> BridgeResponse {
        let appId = request.appId.isEmpty ? "default_app" : request.appId
        
        return await withCheckedContinuation { continuation in
            DispatchQueue.main.async {
                var configuration = PHPickerConfiguration()
                configuration.filter = .images
                configuration.selectionLimit = 1
                
                let picker = PHPickerViewController(configuration: configuration)
                let delegate = PhotosPickerDelegate(appId: appId) { result in
                    continuation.resume(returning: result)
                }
                
                picker.delegate = delegate
                
                // Maintain strong reference to delegate during presentation
                objc_setAssociatedObject(picker, &PhotosPickerDelegate.associationKey, delegate, .OBJC_ASSOCIATION_RETAIN_NONATOMIC)
                
                guard let topVC = self.getTopViewController() else {
                    continuation.resume(returning: .failure(code: "VIEW_CONTROLLER_ERROR", message: "Failed to find top ViewController to present PhotosPicker."))
                    return
                }
                
                topVC.present(picker, animated: true, completion: nil)
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

// MARK: - Delegate Coordinator

final class PhotosPickerDelegate: NSObject, PHPickerViewControllerDelegate {
    static var associationKey: UInt8 = 0
    
    private let appId: String
    private let completion: (BridgeResponse) -> Void
    
    init(appId: String, completion: @escaping (BridgeResponse) -> Void) {
        self.appId = appId
        self.completion = completion
    }
    
    func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
        picker.dismiss(animated: true, completion: nil)
        
        guard let provider = results.first?.itemProvider, provider.canLoadObject(ofClass: UIImage.self) else {
            completion(.failure(code: "CANCELLED", message: "User cancelled or picked non-image file."))
            return
        }
        
        provider.loadObject(ofClass: UIImage.self) { [weak self] object, error in
            guard let self = self else { return }
            if let image = object as? UIImage {
                // Save image into the Mini App sandbox temp directory
                let fileManager = FileManager.default
                let documentsURL = fileManager.urls(for: .documentDirectory, in: .userDomainMask)[0]
                let sandboxBase = documentsURL
                    .appendingPathComponent("MiniAppsData", isDirectory: true)
                    .appendingPathComponent(self.appId, isDirectory: true)
                    .standardized
                    .resolvingSymlinksInPath()
                
                let fileURL = sandboxBase.appendingPathComponent("temp_picked_image.jpg")
                
                try? fileManager.createDirectory(at: sandboxBase, withIntermediateDirectories: true, attributes: nil)
                
                if let data = image.jpegData(compressionQuality: 0.8) {
                    do {
                        try data.write(to: fileURL)
                        self.completion(.success([
                            "success": true,
                            "path": "temp_picked_image.jpg"
                        ]))
                    } catch {
                        self.completion(.failure(code: "SAVE_ERROR", message: "Failed to write selected image: \(error.localizedDescription)"))
                    }
                } else {
                    self.completion(.failure(code: "CONVERSION_ERROR", message: "Failed to parse image data."))
                }
            } else {
                let msg = error?.localizedDescription ?? "Failed to load selected photo object."
                self.completion(.failure(code: "LOAD_ERROR", message: msg))
            }
        }
    }
}

import UIKit
import AVFoundation
import GRDB

/// Centralized permission controller managing whitelisting, database cache state, custom dynamic alerts, and system authorization
final class PermissionManager {
    static let shared = PermissionManager()
    
    private init() {}
    
    /// Checks, requests, and verifies authorization across Manifest, SQLite, Dialog, and iOS System boundaries.
    func checkAndRequestPermission(
        appId: String,
        appName: String,
        permission: Permission,
        manifest: WebRuntimeManifest,
        completion: @escaping (Bool) -> Void
    ) {
        // Layer 1: Whitelist check in manifest.permissions
        guard let manifestPermissions = manifest.permissions,
              let declaredPermission = manifestPermissions.first(where: { $0.name == permission.rawValue }) else {
            print("[PermissionManager] Rejection: Permission '\(permission.rawValue)' is not declared in manifest for \(appId)")
            completion(false)
            return
        }
        
        let reason = declaredPermission.reason
        
        // Layer 2: SQLite database state check
        let dbState = checkDatabasePermission(appId: appId, permission: permission)
        
        switch dbState {
        case .granted:
            // Check iOS hardware system permissions
            verifySystemPermission(permission: permission, completion: completion)
            
        case .denied, .restricted:
            completion(false)
            
        case .notDetermined:
            // Layer 3: Dynamic user alert popup with manifest-specified custom reason
            promptUserPermission(appId: appId, appName: appName, permission: permission, reason: reason) { [weak self] granted in
                guard let self = self else {
                    completion(false)
                    return
                }
                if granted {
                    self.verifySystemPermission(permission: permission, completion: completion)
                } else {
                    completion(false)
                }
            }
        }
    }
    
    private func checkDatabasePermission(appId: String, permission: Permission) -> PermissionState {
        do {
            var granted: Bool?
            try MiniAppDatabase.shared.read { db in
                let row = try Row.fetchOne(db, sql: """
                    SELECT granted FROM permissions WHERE app_id = ? AND permission = ?
                """, arguments: [appId, permission.rawValue])
                granted = row?["granted"] as Bool?
            }
            
            if let isGranted = granted {
                return isGranted ? .granted : .denied
            }
        } catch {
            print("[PermissionManager] SQLite lookup failed: \(error.localizedDescription)")
        }
        return .notDetermined
    }
    
    private func promptUserPermission(
        appId: String,
        appName: String,
        permission: Permission,
        reason: String,
        completion: @escaping (Bool) -> Void
    ) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else {
                completion(false)
                return
            }
            
            guard let topVC = self.getTopViewController() else {
                print("[PermissionManager] No top ViewController found to show alert.")
                completion(false)
                return
            }
            
            let alert = UIAlertController(
                title: "Permission Request",
                message: "Mini App \"\(appName)\" wants permission to access: \"\(permission.rawValue)\".\n\nReason: \(reason)",
                preferredStyle: .alert
            )
            
            alert.addAction(UIAlertAction(title: "Deny", style: .cancel) { _ in
                self.savePermission(appId: appId, permission: permission, granted: false)
                completion(false)
            })
            
            alert.addAction(UIAlertAction(title: "Allow", style: .default) { _ in
                self.savePermission(appId: appId, permission: permission, granted: true)
                completion(true)
            })
            
            topVC.present(alert, animated: true)
        }
    }
    
    private func verifySystemPermission(permission: Permission, completion: @escaping (Bool) -> Void) {
        switch permission {
        case .camera:
            let status = AVCaptureDevice.authorizationStatus(for: .video)
            switch status {
            case .authorized:
                completion(true)
            case .denied, .restricted:
                completion(false)
            case .notDetermined:
                AVCaptureDevice.requestAccess(for: .video) { granted in
                    completion(granted)
                }
            @unknown default:
                completion(false)
            }
        default:
            // Non-hardware sandbox capabilities (wasm, filesystem) bypass hardware prompts
            completion(true)
        }
    }
    
    private func savePermission(appId: String, permission: Permission, granted: Bool) {
        DispatchQueue.global(qos: .userInitiated).async {
            do {
                try MiniAppDatabase.shared.write { db in
                    try db.execute(sql: """
                        INSERT INTO permissions (app_id, permission, granted)
                        VALUES (?, ?, ?)
                        ON CONFLICT(app_id, permission) DO UPDATE SET granted = excluded.granted
                    """, arguments: [appId, permission.rawValue, granted])
                }
                print("[PermissionManager] Saved permission: \(permission.rawValue) = \(granted) for \(appId)")
            } catch {
                print("[PermissionManager] Failed to save permission to SQLite: \(error.localizedDescription)")
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

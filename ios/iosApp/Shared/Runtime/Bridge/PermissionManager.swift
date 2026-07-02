import UIKit
import AVFoundation
import CoreLocation
import UserNotifications
import LocalAuthentication
import Contacts
import CoreBluetooth
import Photos
import GRDB

struct BridgeCallContext {
    let appId: String
    let frameOrigin: String
    let hasUserGesture: Bool
    let method: String
}

/// Centralized permission controller managing whitelisting, database cache state, custom dynamic alerts, and system authorization
final class PermissionManager {
    static let shared = PermissionManager()
    
    private init() {}
    
    // MARK: - Public Core API
    
    /// Kiểm tra trạng thái cấp quyền hiện hành (Không hiển thị prompt)
    func checkPermission(
        appId: String,
        permission: Permission,
        manifest: WebRuntimeManifest
    ) async -> PermissionResult {
        let isRequired = manifest.permissionConfig(for: permission)?.required ?? false
        
        // Lớp 1: Xác nhận Plugin tương ứng đã được đăng ký và hoạt động
        guard PluginRegistry.shared.isPluginAvailable(for: permission, appId: appId) else {
            return PermissionResult(
                permission: permission,
                status: .unavailable,
                code: .pluginUnavailable,
                required: isRequired
            )
        }
        
        // Lớp 2: Kiểm tra Manifest Allowlist
        guard let _ = manifest.permissionConfig(for: permission) else {
            return PermissionResult(
                permission: permission,
                status: .denied,
                code: .permissionNotDeclared,
                required: isRequired
            )
        }
        
        // Lớp 3: Kiểm tra Shell Decision lưu trong SQLite
        let shellDecision = await getShellDecision(appId: appId, permission: permission)
        switch shellDecision {
        case .denied:
            return PermissionResult(
                permission: permission,
                status: .denied,
                code: .permissionDeniedByShell,
                required: isRequired
            )
        case .notAsked:
            return PermissionResult(
                permission: permission,
                status: .notDetermined,
                code: nil,
                required: isRequired
            )
        case .approved:
            break
        }
        
        // Lớp 4: Kiểm tra trạng thái thực tế từ hệ thống iOS
        if permission.kind == .runtime {
            // Đối với các capability runtime nội bộ, chỉ cần Shell Decision được phê duyệt
            return PermissionResult(
                permission: permission,
                status: .granted,
                code: nil,
                required: isRequired
            )
        }
        
        let systemStatus = await checkSystemPermissionStatus(permission)
        let errorCode: PermissionErrorCode? = (systemStatus == .granted) ? nil : .permissionDeniedBySystem
        return PermissionResult(
            permission: permission,
            status: systemStatus,
            code: errorCode,
            required: isRequired
        )
    }
    
    /// Yêu cầu cấp quyền động (Lazy Request)
    @MainActor
    func requestPermission(
        appId: String,
        appName: String,
        permission: Permission,
        manifest: WebRuntimeManifest,
        context: BridgeCallContext
    ) async -> PermissionResult {
        let isRequired = manifest.permissionConfig(for: permission)?.required ?? false
        
        // 1. Phải thỏa mãn Manifest Allowlist trước
        guard let declared = manifest.permissionConfig(for: permission) else {
            return PermissionResult(
                permission: permission,
                status: .denied,
                code: .permissionNotDeclared,
                required: isRequired
            )
        }
        
        // 2. Kiểm tra yêu cầu User Gesture đối với các API nhạy cảm
        let gestureRequiredPermissions: [Permission] = [.camera, .microphone, .photosPicker, .biometrics, .bluetooth]
        if gestureRequiredPermissions.contains(permission) && !context.hasUserGesture {
            return PermissionResult(
                permission: permission,
                status: .denied,
                code: .userGestureRequired,
                required: isRequired
            )
        }
        
        // Kiểm tra khả năng hoạt động của plugin
        guard PluginRegistry.shared.isPluginAvailable(for: permission, appId: appId) else {
            return PermissionResult(
                permission: permission,
                status: .unavailable,
                code: .pluginUnavailable,
                required: isRequired
            )
        }
        
        // Tránh ghi đè trạng thái sinh trắc học hệ thống, chỉ kiểm tra sự đồng ý của Shell
        if permission == .biometrics {
            let shellDecision = await getShellDecision(appId: appId, permission: permission)
            if shellDecision == .notAsked {
                let userApproved = await promptShellDialog(appName: appName, permission: permission, reason: declared.reason)
                guard userApproved else {
                    await saveShellDecision(appId: appId, permission: permission, decision: .denied)
                    return PermissionResult(
                        permission: permission,
                        status: .denied,
                        code: .permissionDeniedByShell,
                        required: isRequired
                    )
                }
                await saveShellDecision(appId: appId, permission: permission, decision: .approved)
            } else if shellDecision == .denied {
                return PermissionResult(
                    permission: permission,
                    status: .denied,
                    code: .permissionDeniedByShell,
                    required: isRequired
                )
            }
            
            // Thực hiện xác thực sinh trắc học từng lần (one-time auth action)
            let finalStatus = await requestSystemPermissionPrompt(permission, reason: declared.reason)
            let code = finalStatus == .granted ? nil : PermissionErrorCode.permissionDeniedBySystem
            return PermissionResult(
                permission: permission,
                status: finalStatus,
                code: code,
                required: isRequired
            )
        }
        
        let currentResult = await checkPermission(appId: appId, permission: permission, manifest: manifest)
        guard currentResult.status == .notDetermined else {
            return currentResult
        }
        
        // 3. Hiển thị Dialog thông báo nội bộ của Shell giải thích lý do (Apple HIG Compliance)
        let userApproved = await promptShellDialog(appName: appName, permission: permission, reason: declared.reason)
        guard userApproved else {
            await saveShellDecision(appId: appId, permission: permission, decision: .denied)
            return PermissionResult(
                permission: permission,
                status: .denied,
                code: .permissionDeniedByShell,
                required: isRequired
            )
        }
        
        await saveShellDecision(appId: appId, permission: permission, decision: .approved)
        
        // 4. Gọi prompt hệ thống tương ứng của iOS
        if permission.kind == .runtime {
            return PermissionResult(
                permission: permission,
                status: .granted,
                code: nil,
                required: isRequired
            )
        }
        
        let finalStatus = await requestSystemPermissionPrompt(permission, reason: declared.reason)
        let code = finalStatus == .granted ? nil : PermissionErrorCode.permissionDeniedBySystem
        return PermissionResult(
            permission: permission,
            status: finalStatus,
            code: code,
            required: isRequired
        )
    }
    
    // MARK: - Public Wrappers for Settings UI
    
    /// Lấy quyết định của Shell trong cơ sở dữ liệu SQLite
    func getShellDecisionPublic(appId: String, permission: Permission) async -> ShellDecision {
        return await getShellDecision(appId: appId, permission: permission)
    }
    
    /// Cập nhật quyết định của Shell trực tiếp xuống SQLite
    func saveShellDecisionPublic(appId: String, permission: Permission, decision: ShellDecision) async {
        await saveShellDecision(appId: appId, permission: permission, decision: decision)
    }
    
    /// Live-query kiểm tra trạng thái native của hệ điều hành iOS
    func checkSystemStatusPublic(permission: Permission) async -> RuntimePermissionStatus {
        return await checkSystemPermissionStatus(permission)
    }
    
    // MARK: - Private Database & Dialog Helpers
    
    private func getShellDecision(appId: String, permission: Permission) async -> ShellDecision {
        return await withCheckedContinuation { continuation in
            DispatchQueue.global(qos: .userInitiated).async {
                do {
                    var granted: Bool?
                    try MiniAppDatabase.shared.read { db in
                        let row = try Row.fetchOne(db, sql: """
                            SELECT granted FROM permissions WHERE app_id = ? AND permission = ?
                        """, arguments: [appId, permission.rawValue])
                        granted = row?["granted"] as Bool?
                    }
                    
                    if let isGranted = granted {
                        continuation.resume(returning: isGranted ? .approved : .denied)
                    } else {
                        continuation.resume(returning: .notAsked)
                    }
                } catch {
                    print("[PermissionManager] SQLite lookup failed: \(error.localizedDescription)")
                    continuation.resume(returning: .notAsked)
                }
            }
        }
    }
    
    private func saveShellDecision(appId: String, permission: Permission, decision: ShellDecision) async {
        guard decision != .notAsked else { return }
        let granted = (decision == .approved)
        return await withCheckedContinuation { continuation in
            DispatchQueue.global(qos: .userInitiated).async {
                do {
                    try MiniAppDatabase.shared.write { db in
                        try db.execute(sql: """
                            INSERT INTO permissions (app_id, permission, granted)
                            VALUES (?, ?, ?)
                            ON CONFLICT(app_id, permission) DO UPDATE SET granted = excluded.granted
                        """, arguments: [appId, permission.rawValue, granted])
                    }
                    continuation.resume()
                } catch {
                    print("[PermissionManager] SQLite save failed: \(error.localizedDescription)")
                    continuation.resume()
                }
            }
        }
    }
    
    @MainActor
    private func promptShellDialog(appName: String, permission: Permission, reason: String) async -> Bool {
        return await withCheckedContinuation { continuation in
            guard let topVC = self.getTopViewController() else {
                print("[PermissionManager] No top ViewController found to show alert.")
                continuation.resume(returning: false)
                return
            }
            
            let alert = UIAlertController(
                title: "Yêu cầu cấp quyền",
                message: "Ứng dụng \"\(appName)\" yêu cầu quyền truy cập: \"\(permission.rawValue)\".\n\nLý do: \(reason)",
                preferredStyle: .alert
            )
            
            alert.addAction(UIAlertAction(title: "Từ chối", style: .cancel) { _ in
                continuation.resume(returning: false)
            })
            
            alert.addAction(UIAlertAction(title: "Cho phép", style: .default) { _ in
                continuation.resume(returning: true)
            })
            
            topVC.present(alert, animated: true)
        }
    }
    
    private func getTopViewController() -> UIViewController? {
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let rootVC = windowScene.windows.first(where: { $0.isKeyWindow })?.rootViewController else {
            return nil
        }
        
        var topVC = rootVC
        while let presentedVC = topVC.presentedViewController {
            topVC = presentedVC
        }
        return topVC
    }
    
    // MARK: - Private iOS System Integrations
    
    private func checkSystemPermissionStatus(_ permission: Permission) async -> RuntimePermissionStatus {
        switch permission {
        case .camera:
            return mapAVAuthorizationStatus(AVCaptureDevice.authorizationStatus(for: .video))
        case .microphone:
            if #available(iOS 17.0, *) {
                return checkMicrophoneStatusiOS17()
            } else {
                return mapAVAudioSessionPermission(AVAudioSession.sharedInstance().recordPermission)
            }
        case .location:
            let manager = CLLocationManager()
            return mapLocationStatus(manager.authorizationStatus)
        case .notification:
            return await checkNotificationStatus()
        case .biometrics:
            let context = LAContext()
            var error: NSError?
            if context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) {
                return .granted
            } else {
                if let err = error {
                    if err.code == LAError.biometryNotEnrolled.rawValue {
                        return .notEnrolled
                    } else if err.code == LAError.biometryLockout.rawValue {
                        return .lockedOut
                    }
                }
                return .unavailable
            }
        case .contacts:
            return mapContactStatus(CNContactStore.authorizationStatus(for: .contacts))
        case .bluetooth:
            return mapBluetoothStatus(CBCentralManager.authorization)
        case .photosAddOnly:
            return mapPhotoStatus(PHPhotoLibrary.authorizationStatus(for: .addOnly))
        default:
            return .unavailable
        }
    }
    
    private func requestSystemPermissionPrompt(_ permission: Permission, reason: String) async -> RuntimePermissionStatus {
        switch permission {
        case .camera:
            let granted = await AVCaptureDevice.requestAccess(for: .video)
            return granted ? .granted : .denied
            
        case .microphone:
            if #available(iOS 17.0, *) {
                let granted = await AVAudioApplication.requestRecordPermission()
                return granted ? .granted : .denied
            } else {
                return await withCheckedContinuation { continuation in
                    AVAudioSession.sharedInstance().requestRecordPermission { granted in
                        continuation.resume(returning: granted ? .granted : .denied)
                    }
                }
            }
            
        case .location:
            return await LocationPermissionHandler.shared.requestPermission()
            
        case .notification:
            do {
                let granted = try await UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge])
                return granted ? .granted : .denied
            } catch {
                return .denied
            }
            
        case .biometrics:
            let context = LAContext()
            do {
                let success = try await context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, localizedReason: reason)
                return success ? .granted : .denied
            } catch {
                return .denied
            }
            
        case .contacts:
            do {
                let granted = try await CNContactStore().requestAccess(for: .contacts)
                return granted ? .granted : .denied
            } catch {
                return .denied
            }
            
        case .photosAddOnly:
            let status = await PHPhotoLibrary.requestAuthorization(for: .addOnly)
            return mapPhotoStatus(status)
            
        case .bluetooth:
            return await BluetoothPermissionHandler.shared.requestPermission()
            
        default:
            return .unavailable
        }
    }
    
    // MARK: - Status Mapping Helpers
    
    private func mapAVAuthorizationStatus(_ status: AVAuthorizationStatus) -> RuntimePermissionStatus {
        switch status {
        case .authorized:
            return .granted
        case .denied, .restricted:
            return .denied
        case .notDetermined:
            return .notDetermined
        @unknown default:
            return .unavailable
        }
    }
    
    @available(iOS 17.0, *)
    private func checkMicrophoneStatusiOS17() -> RuntimePermissionStatus {
        let status = AVAudioApplication.shared.recordPermission
        switch status {
        case .granted:
            return .granted
        case .denied:
            return .denied
        case .undetermined:
            return .notDetermined
        @unknown default:
            return .unavailable
        }
    }
    
    private func mapAVAudioSessionPermission(_ status: AVAudioSession.RecordPermission) -> RuntimePermissionStatus {
        switch status {
        case .granted:
            return .granted
        case .denied:
            return .denied
        case .undetermined:
            return .notDetermined
        @unknown default:
            return .unavailable
        }
    }
    
    private func mapLocationStatus(_ status: CLAuthorizationStatus) -> RuntimePermissionStatus {
        switch status {
        case .authorizedAlways, .authorizedWhenInUse:
            return .granted
        case .denied, .restricted:
            return .denied
        case .notDetermined:
            return .notDetermined
        @unknown default:
            return .unavailable
        }
    }
    
    private func checkNotificationStatus() async -> RuntimePermissionStatus {
        let settings = await UNUserNotificationCenter.current().notificationSettings()
        switch settings.authorizationStatus {
        case .authorized:
            return .granted
        case .denied:
            return .denied
        case .notDetermined:
            return .notDetermined
        case .provisional, .ephemeral:
            return .limited
        @unknown default:
            return .unavailable
        }
    }
    
    private func mapContactStatus(_ status: CNAuthorizationStatus) -> RuntimePermissionStatus {
        switch status {
        case .authorized:
            return .granted
        case .denied, .restricted:
            return .denied
        case .notDetermined:
            return .notDetermined
        case .limited:
            return .limited
        @unknown default:
            return .unavailable
        }
    }
    
    private func mapBluetoothStatus(_ status: CBManagerAuthorization) -> RuntimePermissionStatus {
        switch status {
        case .allowedAlways:
            return .granted
        case .denied, .restricted:
            return .denied
        case .notDetermined:
            return .notDetermined
        @unknown default:
            return .unavailable
        }
    }
    
    private func mapPhotoStatus(_ status: PHAuthorizationStatus) -> RuntimePermissionStatus {
        switch status {
        case .authorized:
            return .granted
        case .limited:
            return .limited
        case .denied, .restricted:
            return .denied
        case .notDetermined:
            return .notDetermined
        @unknown default:
            return .unavailable
        }
    }
}

// MARK: - CLLocationManager Delegate Helper

final class LocationPermissionHandler: NSObject, CLLocationManagerDelegate, @unchecked Sendable {
    static let shared = LocationPermissionHandler()
    
    private var locationManager: CLLocationManager?
    private var continuation: CheckedContinuation<RuntimePermissionStatus, Never>?
    private var didFinish = false
    private var timeoutTask: Task<Void, Never>?
    
    func requestPermission() async -> RuntimePermissionStatus {
        return await withCheckedContinuation { continuation in
            DispatchQueue.main.async {
                let status = CLLocationManager().authorizationStatus
                guard status == .notDetermined else {
                    continuation.resume(returning: self.mapStatus(status))
                    return
                }
                
                self.didFinish = false
                self.continuation = continuation
                
                let manager = CLLocationManager()
                manager.delegate = self
                self.locationManager = manager
                manager.requestWhenInUseAuthorization()
                
                // 30s timeout fallback
                self.timeoutTask = Task {
                    try? await Task.sleep(nanoseconds: 30_000_000_000)
                    guard !Task.isCancelled else { return }
                    self.finish(.unavailable)
                }
            }
        }
    }
    
    private func finish(_ status: RuntimePermissionStatus) {
        guard !didFinish else { return }
        didFinish = true
        timeoutTask?.cancel()
        continuation?.resume(returning: status)
        continuation = nil
        locationManager = nil
    }
    
    private func mapStatus(_ status: CLAuthorizationStatus) -> RuntimePermissionStatus {
        switch status {
        case .authorizedAlways, .authorizedWhenInUse:
            return .granted
        case .denied, .restricted:
            return .denied
        case .notDetermined:
            return .notDetermined
        @unknown default:
            return .unavailable
        }
    }
    
    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        let status = manager.authorizationStatus
        if status != .notDetermined {
            finish(mapStatus(status))
        }
    }
}

// MARK: - CBCentralManager Delegate Helper

final class BluetoothPermissionHandler: NSObject, CBCentralManagerDelegate, @unchecked Sendable {
    static let shared = BluetoothPermissionHandler()
    
    private var centralManager: CBCentralManager?
    private var continuation: CheckedContinuation<RuntimePermissionStatus, Never>?
    private var didFinish = false
    private var timeoutTask: Task<Void, Never>?
    
    func requestPermission() async -> RuntimePermissionStatus {
        return await withCheckedContinuation { continuation in
            DispatchQueue.main.async {
                let status = CBCentralManager.authorization
                guard status == .notDetermined else {
                    continuation.resume(returning: self.mapStatus(status))
                    return
                }
                
                self.didFinish = false
                self.continuation = continuation
                
                self.centralManager = CBCentralManager(
                    delegate: self,
                    queue: nil,
                    options: [CBCentralManagerOptionShowPowerAlertKey: false]
                )
                
                // 30s timeout fallback
                self.timeoutTask = Task {
                    try? await Task.sleep(nanoseconds: 30_000_000_000)
                    guard !Task.isCancelled else { return }
                    self.finish(.unavailable)
                }
            }
        }
    }
    
    private func finish(_ status: RuntimePermissionStatus) {
        guard !didFinish else { return }
        didFinish = true
        timeoutTask?.cancel()
        continuation?.resume(returning: status)
        continuation = nil
        centralManager = nil
    }
    
    private func mapStatus(_ status: CBManagerAuthorization) -> RuntimePermissionStatus {
        switch status {
        case .allowedAlways:
            return .granted
        case .denied, .restricted:
            return .denied
        case .notDetermined:
            return .notDetermined
        @unknown default:
            return .unavailable
        }
    }
    
    func centralManagerDidUpdateState(_ central: CBCentralManager) {
        let status = CBCentralManager.authorization
        if status != .notDetermined {
            finish(mapStatus(status))
        }
    }
}

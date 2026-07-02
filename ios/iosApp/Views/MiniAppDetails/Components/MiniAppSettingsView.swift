import ExploreSwiftUI
import SwiftUI
import GRDB

@MainActor
final class MiniAppSettingsViewModel: ObservableObject {
    let appId: String
    
    @Published var permissionStates: [PermissionItem] = []
    @Published var appName: String = "Mini Application"
    @Published var developerName: String = "Lepos Third-Party Developer"
    @Published var version: String = "1.0.0"
    
    struct PermissionItem: Identifiable {
        let permission: Permission
        let title: String
        let icon: String
        let iconColor: Color
        var shellDecision: ShellDecision
        var systemStatus: RuntimePermissionStatus
        
        var id: String { permission.rawValue }
    }
    
    init(appId: String) {
        self.appId = appId
    }
    
    private func fetchAppDetails(appId: String) -> (name: String, version: String)? {
        do {
            return try MiniAppDatabase.shared.read { db in
                if let row = try Row.fetchOne(db, sql: "SELECT name, current_version FROM mini_apps WHERE id = ?", arguments: [appId]) {
                    let name: String = row["name"] ?? "Mini Application"
                    let version: String = row["current_version"] ?? "1.0.0"
                    return (name, version)
                }
                return nil
            }
        } catch {
            print("Failed to fetch app details: \(error)")
            return nil
        }
    }
    
    func loadPermissions() async {
        // Query app metadata from SQLite to display true name/version
        if let details = fetchAppDetails(appId: appId) {
            self.appName = details.name
            self.version = details.version
        }
        
        // Define active permissions to manage (11 permissions)
        let items: [(Permission, String, String, Color)] = [
            (.camera, "Camera", "camera.fill", .purple),
            (.location, "Vị trí", "location.fill", .blue),
            (.microphone, "Microphone", "mic.fill", .orange),
            (.contacts, "Danh bạ", "person.crop.circle.fill", .green),
            (.biometrics, "Face ID / Touch ID", "faceid", .cyan),
            (.bluetooth, "Bluetooth", "wave.3.left.fill", .teal),
            (.photosPicker, "Chọn ảnh (PhotosPicker)", "photo.on.rectangle.angled", .pink),
            (.photosAddOnly, "Thêm ảnh vào thư viện", "photo.fill.on.rectangle.fill", .red),
            (.filesystem, "Hộp cát Filesystem", "folder.fill", .yellow),
            (.wasm, "Thực thi WebAssembly", "cpu.fill", .gray),
            (.notification, "Thông báo", "bell.fill", .indigo)
        ]
        
        var states: [PermissionItem] = []
        for (permission, title, icon, color) in items {
            let shell = await PermissionManager.shared.getShellDecisionPublic(appId: appId, permission: permission)
            let system = await PermissionManager.shared.checkSystemStatusPublic(permission: permission)
            states.append(PermissionItem(
                permission: permission,
                title: title,
                icon: icon,
                iconColor: color,
                shellDecision: shell,
                systemStatus: system
            ))
        }
        
        self.permissionStates = states
    }
    
    func updateShellDecision(for item: PermissionItem, approved: Bool) async {
        let decision: ShellDecision = approved ? .approved : .denied
        await PermissionManager.shared.saveShellDecisionPublic(appId: appId, permission: item.permission, decision: decision)
        
        // Reload states
        await loadPermissions()
    }
    
    func openSettings() {
        if let url = URL(string: UIApplication.openSettingsURLString) {
            UIApplication.shared.open(url, options: [:], completionHandler: nil)
        }
    }
}

struct MiniAppSettingsView: View {
    @Environment(\.presentationMode) var presentationMode
    @StateObject private var viewModel: MiniAppSettingsViewModel

    init(appId: String) {
        _viewModel = StateObject(wrappedValue: MiniAppSettingsViewModel(appId: appId))
    }

    var body: some View {
        NavigationView {
            UniScrollView {
                VStack(spacing: 24) {
                    // Header / App Info Summary
                    VStack(spacing: 8) {
                        Image(systemName: "cube.box.fill")
                            .font(.system(size: 48))
                            .uniForegroundStyle(.blue)
                            .padding()
                            .background(Color.white)
                            .cornerRadius(16)
                            .shadow(color: .black.opacity(0.05), radius: 5, x: 0, y: 2)

                        Text(viewModel.appName)
                            .font(.title2)
                            .fontWeight(.bold)

                        Text(viewModel.developerName)
                            .font(.subheadline)
                            .uniForegroundStyle(.secondary)
                    }
                    .padding(.top, 24)

                    // PERMISSIONS
                    VStack(alignment: .leading, spacing: 8) {
                        Text("QUẢN LÝ QUYỀN TRUY CẬP")
                            .font(.caption)
                            .fontWeight(.semibold)
                            .uniForegroundStyle(.secondary)
                            .padding(.horizontal)

                        VStack(spacing: 0) {
                            if viewModel.permissionStates.isEmpty {
                                Text("Đang tải dữ liệu quyền...")
                                    .font(.subheadline)
                                    .foregroundColor(.gray)
                                    .padding()
                            } else {
                                ForEach(viewModel.permissionStates) { item in
                                    PermissionTwoTierRow(item: item) { approved in
                                        Task {
                                            await viewModel.updateShellDecision(for: item, approved: approved)
                                        }
                                    } onOpenSettings: {
                                        viewModel.openSettings()
                                    }
                                    if item.id != viewModel.permissionStates.last?.id {
                                        UniDivider().padding(.leading, 56)
                                    }
                                }
                            }
                        }
                        .uniGlass(cornerRadius: 16)
                    }
                    .padding(.horizontal)

                    // MINI APP INFO
                    VStack(alignment: .leading, spacing: 8) {
                        Text("THÔNG TIN MINI APP")
                            .font(.caption)
                            .fontWeight(.semibold)
                            .uniForegroundStyle(.secondary)
                            .padding(.horizontal)

                        VStack(spacing: 0) {
                            InfoRowSettings(label: "Nhà phát triển", value: viewModel.developerName)
                            UniDivider().padding(.leading, 16)
                            InfoRowSettings(label: "Phiên bản", value: viewModel.version)
                            UniDivider().padding(.leading, 16)
                            InfoRowSettings(label: "Mã định danh (appId)", value: viewModel.appId)
                        }
                        .uniGlass(cornerRadius: 16)
                    }
                    .padding(.horizontal)

                    // ACTIONS
                    VStack(spacing: 16) {
                        UniButton(action: {
                            presentationMode.wrappedValue.dismiss()
                        }) {
                            Text("Đóng và Khởi chạy lại")
                                .fontWeight(.semibold)
                                .uniForegroundStyle(.blue)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.white)
                                .cornerRadius(16)
                        }
                        .uniButtonStyle(.plain)
                    }
                    .padding(.horizontal)
                    .padding(.bottom, 32)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    UniButton("Xong") {
                        presentationMode.wrappedValue.dismiss()
                    }
                    .uniButtonStyle(.plain)
                }
            }
            .onAppear {
                Task {
                    await viewModel.loadPermissions()
                }
            }
        }
    }
}

struct PermissionTwoTierRow: View {
    let item: MiniAppSettingsViewModel.PermissionItem
    let onToggle: (Bool) -> Void
    let onOpenSettings: () -> Void

    var body: some View {
        HStack(spacing: 16) {
            ZStack {
                RoundedRectangle(cornerRadius: 8)
                    .fill(item.iconColor)
                    .frame(width: 32, height: 32)
                Image(systemName: item.icon)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.white)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(item.title)
                    .font(.body)
                    .fontWeight(.medium)
                
                // Show iOS System Status under it
                HStack(spacing: 4) {
                    Text("Hệ thống iOS:")
                        .font(.system(size: 10))
                        .foregroundColor(.gray)
                    Text(systemStatusString(item.systemStatus))
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(systemStatusColor(item.systemStatus))
                    
                    if item.systemStatus == .denied {
                        Button(action: onOpenSettings) {
                            Text("(Mở Cài đặt)")
                                .font(.system(size: 10))
                                .foregroundColor(.blue)
                                .underline()
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                }
            }

            Spacer()

            Toggle("", isOn: Binding(
                get: { item.shellDecision == .approved },
                set: { onToggle($0) }
            ))
            .labelsHidden()
        }
        .padding()
    }
    
    private func systemStatusString(_ status: RuntimePermissionStatus) -> String {
        switch status {
        case .granted: return "Đã cấp quyền"
        case .denied: return "Từ chối"
        case .limited: return "Giới hạn"
        case .notDetermined: return "Chưa yêu cầu"
        case .unavailable: return "Không sẵn có"
        case .restricted: return "Bị giới hạn (Restricted)"
        case .notEnrolled: return "Chưa đăng ký (Not Enrolled)"
        case .lockedOut: return "Bị khóa (Locked Out)"
        }
    }
    
    private func systemStatusColor(_ status: RuntimePermissionStatus) -> Color {
        switch status {
        case .granted: return .green
        case .denied, .lockedOut: return .red
        case .limited, .restricted: return .orange
        case .notDetermined, .notEnrolled: return .gray
        case .unavailable: return .secondary
        }
    }
}

struct InfoRowSettings: View {
    let label: String
    let value: String
    var hasArrow: Bool = false

    var body: some View {
        HStack {
            Text(label)
                .uniForegroundStyle(.primary)
            Spacer()
            Text(value)
                .uniForegroundStyle(.secondary)
            if hasArrow {
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .uniForegroundStyle(.secondary, opacity: 0.5)
            }
        }
        .padding()
        .font(.subheadline)
    }
}

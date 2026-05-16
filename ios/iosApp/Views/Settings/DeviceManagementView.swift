import SwiftUI
import AdaptiveSwiftUi


struct DeviceManagementView: View {
    // Mock Data
    struct Device: Identifiable {
        let id = UUID()
        let name: String
        let type: String // "iPhone", "iPad", "Mac", "Android"
        let lastActive: String
        let isCurrent: Bool
    }
    
    let devices = [
        Device(name: "iPhone 15 Pro", type: "iPhone", lastActive: "Active now", isCurrent: true),
        Device(name: "iPad Air", type: "iPad", lastActive: "Yesterday", isCurrent: false),
        Device(name: "MacBook Pro", type: "Mac", lastActive: "3 days ago", isCurrent: false),
        Device(name: "Pixel 8", type: "Android", lastActive: "1 week ago", isCurrent: false)
    ]
    
    var body: some View {
        AdaptiveList {
            Section(header: Text("Current Device")) {
                ForEach(devices.filter { $0.isCurrent }) { device in
                    DeviceRow(device: device)
                }
            }
            
            Section(header: Text("Other Devices")) {
                ForEach(devices.filter { !$0.isCurrent }) { device in
                    DeviceRow(device: device)
                }
            }
            
            Section {
                AdaptiveButton(action: {
                    // Sign out all action
                }) {
                    Text("Sign Out All Other Devices")
                        .adaptiveForegroundStyle(.red)
                }
                .adaptiveButtonStyle(.plain)
            } footer: {
                Text("Signing out will remove access to your account on those devices.")
            }
        }
        .navigationTitle("Devices")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct DeviceRow: View {
    let device: DeviceManagementView.Device
    
    var iconName: String {
        switch device.type {
        case "iPhone": return "iphone"
        case "iPad": return "ipad"
        case "Mac": return "macbook"
        case "Android": return "smartphone"
        default: return "device.laptop"
        }
    }
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: iconName)
                .font(.title2)
                .adaptiveForegroundStyle(.blue)
                .frame(width: 32)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(device.name)
                    .font(.body)
                    .fontWeight(.medium)
                
                Text(device.lastActive)
                    .font(.caption)
                    .adaptiveForegroundStyle(device.isCurrent ? .green : .secondary)
            }
            
            Spacer()
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    NavigationView {
        DeviceManagementView()
    }
}

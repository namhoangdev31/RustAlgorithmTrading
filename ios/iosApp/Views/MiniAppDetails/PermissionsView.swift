import SwiftUI

struct PermissionsView: View {
    let appId: String
    
    var body: some View {
        List {
            Section {
                VStack(alignment: .leading, spacing: 16) {
                    Text("This app installs gracefully and does not require special permissions to run.")
                        .font(.body)
                        .foregroundColor(.secondary)
                }
                .padding(.vertical, 8)
            }
            
            Section(header: Text("Optional Permissions")) {
                HStack {
                    Image(systemName: "camera.fill")
                        .foregroundColor(.white)
                        .frame(width: 28, height: 28)
                        .background(Color.gray)
                        .cornerRadius(6)
                    
                    Text("Camera")
                    Spacer()
                    Text("Ask")
                        .foregroundColor(.secondary)
                }
                
                HStack {
                    Image(systemName: "location.fill")
                        .foregroundColor(.white)
                        .frame(width: 28, height: 28)
                        .background(Color.blue)
                        .cornerRadius(6)
                    
                    Text("Location")
                    Spacer()
                    Text("While Using")
                        .foregroundColor(.secondary)
                }
                
                HStack {
                    Image(systemName: "bell.fill")
                        .foregroundColor(.white)
                        .frame(width: 28, height: 28)
                        .background(Color.red)
                        .cornerRadius(6)
                    
                    Text("Notifications")
                    Spacer()
                    Text("Allowed")
                        .foregroundColor(.secondary)
                }
            }
        }
        .navigationTitle("Permissions")
        .navigationBarTitleDisplayMode(.inline)
    }
}

#Preview {
    NavigationView {
        PermissionsView(appId: "preview")
    }
}

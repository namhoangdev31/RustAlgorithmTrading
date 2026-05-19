import ExploreSwiftUI
import SwiftUI

struct PermissionsView: View {
    let appId: String

    var body: some View {
        UniList {
            Section {
                VStack(alignment: .leading, spacing: 16) {
                    Text(
                        "This app installs gracefully and does not require special permissions to run."
                    )
                    .font(.body)
                    .uniForegroundStyle(.secondary)
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
                        .uniForegroundStyle(.secondary)
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
                        .uniForegroundStyle(.secondary)
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
                        .uniForegroundStyle(.secondary)
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

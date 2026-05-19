import ExploreSwiftUI
import SwiftUI

struct SecuritySettingsView: View {
    @EnvironmentObject var navigation: NavigationViewModel
    @State private var twoFactorEnabled = false
    @State private var biometricsEnabled = true

    var body: some View {
        UniList {
            Section(header: Text("Login Security")) {
                NavigationLink(destination: Text("Change Password View")) {
                    Text("Change Password")
                }

                Toggle("Two-Factor Authentication", isOn: $twoFactorEnabled)
                    .tint(.blue)

                Toggle("Face ID / Touch ID", isOn: $biometricsEnabled)
                    .tint(.blue)
            }

            Section(header: Text("Activity")) {
                Button(action: {
                    navigation.navigate(to: .activity)
                }) {
                    HStack {
                        Text("Recent Login Activity")
                            .uniForegroundStyle(.primary)
                        Spacer()
                        Text("Safe")
                            .uniForegroundStyle(.green)
                            .font(.caption)
                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .uniForegroundStyle(.secondary)
                    }
                }
                .uniButtonStyle(.plain)
            }

            Section(header: Text("Data Privacy")) {
                UniButton(action: {
                    // Download data action
                }) {
                    Text("Download My Data")
                        .uniForegroundStyle(.blue)
                }
                .uniButtonStyle(.plain)
            }
        }
        .navigationTitle("Security")
        .navigationBarTitleDisplayMode(.inline)
    }
}

#Preview {
    NavigationView {
        SecuritySettingsView()
    }
}

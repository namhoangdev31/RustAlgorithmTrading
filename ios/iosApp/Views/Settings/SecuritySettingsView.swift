import SwiftUI
import AdaptiveSwiftUi


struct SecuritySettingsView: View {
    @EnvironmentObject var navigation: NavigationViewModel
    @State private var twoFactorEnabled = false
    @State private var biometricsEnabled = true
    
    var body: some View {
        AdaptiveList {
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
                            .adaptiveForegroundStyle(.primary)
                        Spacer()
                        Text("Safe")
                            .adaptiveForegroundStyle(.green)
                            .font(.caption)
                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .adaptiveForegroundStyle(.secondary)
                    }
                }
                .adaptiveButtonStyle(.plain)
            }
            
            Section(header: Text("Data Privacy")) {
                AdaptiveButton(action: {
                    // Download data action
                }) {
                    Text("Download My Data")
                        .adaptiveForegroundStyle(.blue)
                }
                .adaptiveButtonStyle(.plain)
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

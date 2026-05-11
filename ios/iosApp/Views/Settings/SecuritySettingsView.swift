import SwiftUI

struct SecuritySettingsView: View {
    @State private var twoFactorEnabled = false
    @State private var biometricsEnabled = true
    
    var body: some View {
        List {
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
                NavigationLink(destination: Text("Login Activity View")) {
                    HStack {
                        Text("Recent Login Activity")
                        Spacer()
                        Text("Safe")
                            .foregroundColor(.green)
                            .font(.caption)
                    }
                }
            }
            
            Section(header: Text("Data Privacy")) {
                Button(action: {
                    // Download data action
                }) {
                    Text("Download My Data")
                        .foregroundColor(.blue)
                }
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

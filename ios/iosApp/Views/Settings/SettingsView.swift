import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var navigation: NavigationViewModel
    @AppStorage("isDarkMode") private var isDarkMode = true
    @AppStorage("notificationsEnabled") private var notificationsEnabled = true
    
    var body: some View {
        Form {
            // Account Section
            Section(header: Text("Account")) {
                HStack(spacing: 16) {
                    Image(systemName: "person.crop.circle.fill")
                        .resizable()
                        .frame(width: 50, height: 50)
                        .foregroundColor(.gray)
                    
                    VStack(alignment: .leading, spacing: 4) {
                        Text("John Doe")
                            .font(.headline)
                        Text("john.doe@example.com")
                            .font(.subheadline)
                            .foregroundColor(.gray)
                    }
                }
                .padding(.vertical, 8)
                
                Button(action: {
                    navigation.navigate(to: .editProfile)
                }) {
                    Text("Edit Profile")
                        .foregroundColor(.blue)
                }
            }
            
            // Preferences Section
            Section(header: Text("Preferences")) {
                Toggle("Push Notifications", isOn: $notificationsEnabled)
                Toggle("Dark Mode", isOn: $isDarkMode)
                
                HStack {
                    Text("Language")
                    Spacer()
                    Text("English")
                        .foregroundColor(.gray)
                }
            }
            
            // Data & Storage Section
            Section(header: Text("Data & Storage")) {
                Button(action: {
                   navigation.navigate(to: .downloadHistory)
                }) {
                    Text("Download History")
                        .foregroundColor(.primary)
                }
                
                Button(action: {
                    // Action to clear cache
                }) {
                    HStack {
                        Text("Clear Cache")
                            .foregroundColor(.primary)
                        Spacer()
                        Text("128 MB")
                            .foregroundColor(.gray)
                    }
                }
            }
            
            // About Section
            Section(header: Text("About")) {
                Button(action: {
                    navigation.navigate(to: .aboutApp)
                }) {
                    Text("About Lepos App")
                        .foregroundColor(.primary)
                }

                HStack {
                    Text("Version")
                    Spacer()
                    Text("2.4.1 (Build 2024)")
                        .foregroundColor(.gray)
                }
                
                Button("Terms of Service") { }
                    .foregroundColor(.primary)
                
                Button("Privacy Policy") { }
                    .foregroundColor(.primary)
            }
            
            // Actions Section
            Section {
                Button(action: {
                    // Sign Out Logic
                    // navigation.navigate(to: .login)
                }) {
                    Text("Sign Out")
                        .foregroundColor(.red)
                        .frame(maxWidth: .infinity, alignment: .center)
                }
            }
        }
        .navigationTitle("Settings")
        .navigationBarTitleDisplayMode(.inline)
    }
}

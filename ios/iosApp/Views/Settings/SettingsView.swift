import SwiftUI
import AdaptiveSwiftUi


struct SettingsView: View {
    @EnvironmentObject var navigation: NavigationViewModel
    @AppStorage("isDarkMode") private var isDarkMode = true
    @AppStorage("notificationsEnabled") private var notificationsEnabled = true
    
    var body: some View {
        AdaptiveList {
            // Account Section
            Section(header: Text("Account")) {
                HStack(spacing: 16) {
                    Image(systemName: "person.crop.circle.fill")
                        .resizable()
                        .frame(width: 50, height: 50)
                        .adaptiveForegroundStyle(.secondary)
                    
                    VStack(alignment: .leading, spacing: 4) {
                        Text("John Doe")
                            .font(.headline)
                        Text("john.doe@example.com")
                            .font(.subheadline)
                            .adaptiveForegroundStyle(.secondary)
                    }
                }
                .padding(.vertical, 8)
                
                AdaptiveButton(action: {
                    navigation.navigate(to: .editProfile)
                }) {
                    Text("Edit Profile")
                        .adaptiveForegroundStyle(.blue)
                }
                .adaptiveButtonStyle(.plain)
            }
            
            // Preferences Section
            Section(header: Text("Preferences")) {
                Toggle("Push Notifications", isOn: $notificationsEnabled)
                Toggle("Dark Mode", isOn: $isDarkMode)
                
                HStack {
                    Text("Language")
                    Spacer()
                    Text("English")
                        .adaptiveForegroundStyle(.secondary)
                }
            }
            
            // Data & Storage Section
            Section(header: Text("Data & Storage")) {
                AdaptiveButton(action: {
                   navigation.navigate(to: .downloadHistory)
                }) {
                    Text("Download History")
                        .adaptiveForegroundStyle(.primary)
                }
                .adaptiveButtonStyle(.plain)
                
                AdaptiveButton(action: {
                    // Action to clear cache
                }) {
                    HStack {
                        Text("Clear Cache")
                            .adaptiveForegroundStyle(.primary)
                        Spacer()
                        Text("128 MB")
                            .adaptiveForegroundStyle(.secondary)
                    }
                }
                .adaptiveButtonStyle(.plain)
            }
            
            // About Section
            Section(header: Text("About")) {
                AdaptiveButton(action: {
                    navigation.navigate(to: .aboutApp)
                }) {
                    Text("About Lepos App")
                        .adaptiveForegroundStyle(.primary)
                }
                .adaptiveButtonStyle(.plain)

                HStack {
                    Text("Version")
                    Spacer()
                    Text("2.4.1 (Build 2024)")
                        .adaptiveForegroundStyle(.secondary)
                }
                
                AdaptiveButton("Terms of Service") { }
                    .adaptiveForegroundStyle(.primary)
                    .adaptiveButtonStyle(.plain)
                
                AdaptiveButton("Privacy Policy") { }
                    .adaptiveForegroundStyle(.primary)
                    .adaptiveButtonStyle(.plain)
            }
            
            // Actions Section
            Section {
                AdaptiveButton(action: {
                    // Sign Out Logic
                    // navigation.navigate(to: .login)
                }) {
                    Text("Sign Out")
                        .adaptiveForegroundStyle(.red)
                        .frame(maxWidth: .infinity, alignment: .center)
                }
                .adaptiveButtonStyle(.plain)
            }
        }
        .navigationTitle("Settings")
        .navigationBarTitleDisplayMode(.inline)
    }
}

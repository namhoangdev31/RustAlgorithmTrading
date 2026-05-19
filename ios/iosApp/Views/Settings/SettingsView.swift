import ExploreSwiftUI
import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var navigation: NavigationViewModel
    @AppStorage("isDarkMode") private var isDarkMode = true
    @AppStorage("notificationsEnabled") private var notificationsEnabled = true

    var body: some View {
        UniList {
            // Account Section
            Section(header: Text("Account")) {
                HStack(spacing: 16) {
                    Image(systemName: "person.crop.circle.fill")
                        .resizable()
                        .frame(width: 50, height: 50)
                        .uniForegroundStyle(.secondary)

                    VStack(alignment: .leading, spacing: 4) {
                        Text("John Doe")
                            .font(.headline)
                        Text("john.doe@example.com")
                            .font(.subheadline)
                            .uniForegroundStyle(.secondary)
                    }
                }
                .padding(.vertical, 8)

                UniButton(action: {
                    navigation.navigate(to: .editProfile)
                }) {
                    Text("Edit Profile")
                        .uniForegroundStyle(.blue)
                }
                .uniButtonStyle(.plain)
            }

            // Preferences Section
            Section(header: Text("Preferences")) {
                Toggle("Push Notifications", isOn: $notificationsEnabled)
                Toggle("Dark Mode", isOn: $isDarkMode)

                HStack {
                    Text("Language")
                    Spacer()
                    Text("English")
                        .uniForegroundStyle(.secondary)
                }
            }

            // Data & Storage Section
            Section(header: Text("Data & Storage")) {
                UniButton(action: {
                    navigation.navigate(to: .downloadHistory)
                }) {
                    Text("Download History")
                        .uniForegroundStyle(.primary)
                }
                .uniButtonStyle(.plain)

                UniButton(action: {
                    // Action to clear cache
                }) {
                    HStack {
                        Text("Clear Cache")
                            .uniForegroundStyle(.primary)
                        Spacer()
                        Text("128 MB")
                            .uniForegroundStyle(.secondary)
                    }
                }
                .uniButtonStyle(.plain)
            }

            // About Section
            Section(header: Text("About")) {
                UniButton(action: {
                    navigation.navigate(to: .aboutApp)
                }) {
                    Text("About Lepos App")
                        .uniForegroundStyle(.primary)
                }
                .uniButtonStyle(.plain)

                HStack {
                    Text("Version")
                    Spacer()
                    Text("2.4.1 (Build 2024)")
                        .uniForegroundStyle(.secondary)
                }

                UniButton("Terms of Service") {}
                    .uniForegroundStyle(.primary)
                    .uniButtonStyle(.plain)

                UniButton("Privacy Policy") {}
                    .uniForegroundStyle(.primary)
                    .uniButtonStyle(.plain)
            }

            // Actions Section
            Section {
                UniButton(action: {
                    // Sign Out Logic
                    // navigation.navigate(to: .login)
                }) {
                    Text("Sign Out")
                        .uniForegroundStyle(.red)
                        .frame(maxWidth: .infinity, alignment: .center)
                }
                .uniButtonStyle(.plain)
            }
        }
        .navigationTitle("Settings")
        .navigationBarTitleDisplayMode(.inline)
    }
}

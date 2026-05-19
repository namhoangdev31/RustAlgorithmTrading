import ExploreSwiftUI
import SwiftUI

struct SettingsGridView: View {
    @EnvironmentObject var navigation: NavigationViewModel
    @State private var showLogoutAlert = false

    let columns = [
        GridItem(.flexible(), spacing: 16),
        GridItem(.flexible(), spacing: 16),
    ]

    var body: some View {
        LazyVGrid(columns: columns, spacing: 16) {
            UniButton(action: {
                navigation.navigate(to: .myReviews)
            }) {
                SettingsCard(
                    title: "My Reviews",
                    subtitle: "Rate & Review",
                    icon: "star.bubble.fill",
                    iconColor: .orange
                )
            }
            .uniButtonStyle(.plain)

            UniButton(action: {
                navigation.navigate(to: .notificationPreferences)
            }) {
                SettingsCard(
                    title: "Notifications",
                    subtitle: "Alerts & Push",
                    icon: "bell.badge.fill",
                    iconColor: .red
                )
            }
            .uniButtonStyle(.plain)

            UniButton(action: {
                navigation.navigate(to: .activity)
            }) {
                SettingsCard(
                    title: "Activity",
                    subtitle: "Logs & History",
                    icon: "clock.arrow.circlepath",
                    iconColor: .orange
                )
            }
            .uniButtonStyle(.plain)

            UniButton(action: {
                // Placeholder for security
            }) {
                SettingsCard(
                    title: "Security",
                    subtitle: "2FA & Privacy",
                    icon: "shield.fill",
                    iconColor: .blue
                )
            }
            .uniButtonStyle(.plain)

            UniButton(action: {
                navigation.navigate(to: .helpSupport)
            }) {
                SettingsCard(
                    title: "Support",
                    subtitle: "24/7 Concierge",
                    icon: "questionmark.bubble.fill",
                    iconColor: .gray
                )
            }
            .uniButtonStyle(.plain)

            UniButton(action: {
                showLogoutAlert = true
            }) {
                SettingsCard(
                    title: "Log out",
                    subtitle: "Switch account",
                    icon: "rectangle.portrait.and.arrow.right",
                    iconColor: .red,
                    isDestructive: true
                )
            }
            .uniButtonStyle(.plain)
        }
        .padding(.horizontal)
        .uniAlert("Log Out", isPresented: $showLogoutAlert) {
            Button("Cancel", role: .cancel) {}
            Button("Log Out", role: .destructive) {
                // Reset login state
                UserDefaults.standard.set(false, forKey: "isLoggedIn")
                // Navigate to login if needed, though AppCoordinator usually handles root switch
            }
        } message: {
            Text("Are you sure you want to log out?")
        }
    }
}

struct SettingsCard: View {
    let title: String
    let subtitle: String
    let icon: String
    let iconColor: Color
    var isDestructive: Bool = false

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Image(systemName: icon)
                .font(.title3)
                .uniForegroundStyle(iconColor)
                .padding(10)
                .background(iconColor.opacity(0.1))
                .clipShape(Circle())

            Spacer()

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.bold)
                    .uniForegroundStyle(isDestructive ? .red : .primary)

                Text(subtitle)
                    .font(.caption)
                    .uniForegroundStyle(
                        isDestructive ? .red : .secondary, opacity: isDestructive ? 0.6 : 1.0)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .frame(height: 120)
        .uniGlass(cornerRadius: 20)
    }
}

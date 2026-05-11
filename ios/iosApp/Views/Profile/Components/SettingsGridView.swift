import SwiftUI

struct SettingsGridView: View {
    @EnvironmentObject var navigation: NavigationViewModel
    @State private var showLogoutAlert = false
    
    let columns = [
        GridItem(.flexible(), spacing: 16),
        GridItem(.flexible(), spacing: 16)
    ]
    
    var body: some View {
        LazyVGrid(columns: columns, spacing: 16) {
            Button(action: {
                navigation.navigate(to: .myReviews)
            }) {
                SettingsCard(
                    title: "My Reviews",
                    subtitle: "Rate & Review",
                    icon: "star.bubble.fill",
                    iconColor: .orange
                )
            }
            .buttonStyle(PlainButtonStyle())

            Button(action: {
                navigation.navigate(to: .notificationPreferences)
            }) {
                SettingsCard(
                    title: "Notifications",
                    subtitle: "Alerts & Push",
                    icon: "bell.badge.fill",
                    iconColor: .red
                )
            }
            .buttonStyle(PlainButtonStyle())

            Button(action: {
                // Placeholder
            }) {
                SettingsCard(
                    title: "Security",
                    subtitle: "2FA & Privacy",
                    icon: "shield.fill",
                    iconColor: .blue
                )
            }
            .buttonStyle(PlainButtonStyle())
            
            Button(action: {
                // Placeholder
            }) {
                SettingsCard(
                    title: "Payments",
                    subtitle: "Saved Cards",
                    icon: "creditcard.fill",
                    iconColor: .blue
                )
            }
            .buttonStyle(PlainButtonStyle())
            
            Button(action: {
                navigation.navigate(to: .helpSupport)
            }) {
                SettingsCard(
                    title: "Support",
                    subtitle: "24/7 Concierge",
                    icon: "questionmark.bubble.fill",
                    iconColor: .gray
                )
            }
            .buttonStyle(PlainButtonStyle())
            
            Button(action: {
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
            .buttonStyle(PlainButtonStyle())
        }
        .padding(.horizontal)
        .alert("Log Out", isPresented: $showLogoutAlert) {
            Button("Cancel", role: .cancel) { }
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
                .foregroundColor(iconColor)
                .padding(10)
                .background(iconColor.opacity(0.1))
                .clipShape(Circle())
            
            Spacer()
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(.bold)
                    .foregroundColor(isDestructive ? .red : .primary)
                
                Text(subtitle)
                    .font(.caption)
                    .foregroundColor(isDestructive ? .red.opacity(0.6) : .gray)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .frame(height: 120)
        .background(Color.white)
        .cornerRadius(20)
        .shadow(color: Color.black.opacity(0.03), radius: 10, x: 0, y: 5)
    }
}

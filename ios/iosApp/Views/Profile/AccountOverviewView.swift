import SwiftUI
import AdaptiveSwiftUi


struct AccountOverviewView: View {
    @State private var showingEditProfile = false
    
    var body: some View {
        AdaptiveList {
            Section {
                HStack(spacing: 16) {
                    Circle()
                        .fill(Color.gray.opacity(0.3))
                        .frame(width: 60, height: 60)
                        .overlay(
                            Image(systemName: "person.fill")
                                .font(.title)
                                .adaptiveForegroundStyle(.secondary)
                        )
                    
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
                    showingEditProfile = true
                }) {
                    Text("Edit Profile")
                        .adaptiveForegroundStyle(.blue)
                }
                .adaptiveButtonStyle(.plain)
            }
            
            Section(header: Text("Account Details")) {
                HStack {
                    Text("Username")
                    Spacer()
                    Text("johndoe123")
                        .adaptiveForegroundStyle(.secondary)
                }
                
                HStack {
                    Text("User ID")
                    Spacer()
                    Text("849302")
                        .adaptiveForegroundStyle(.secondary)
                        .font(.monospacedDigit(.body)())
                }
                
                HStack {
                    Text("Joined")
                    Spacer()
                    Text("Feb 2024")
                        .adaptiveForegroundStyle(.secondary)
                }
            }
            
            Section(header: Text("Subscription")) {
                HStack {
                    Text("Plan")
                    Spacer()
                    Text("Free")
                        .adaptiveForegroundStyle(.secondary)
                }
                
                AdaptiveButton(action: {
                    // Upgrade action
                }) {
                    Text("Upgrade to Pro")
                        .adaptiveForegroundStyle(.blue)
                }
                .adaptiveButtonStyle(.plain)
            }
        }
        .navigationTitle("Account")
        .navigationBarTitleDisplayMode(.inline)
    }
}

#Preview {
    NavigationView {
        AccountOverviewView()
    }
}

import ExploreSwiftUI
import SwiftUI

struct AccountOverviewView: View {
    @State private var showingEditProfile = false

    var body: some View {
        UniList {
            Section {
                HStack(spacing: 16) {
                    Circle()
                        .fill(Color.gray.opacity(0.3))
                        .frame(width: 60, height: 60)
                        .overlay(
                            Image(systemName: "person.fill")
                                .font(.title)
                                .uniForegroundStyle(.secondary)
                        )

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
                    showingEditProfile = true
                }) {
                    Text("Edit Profile")
                        .uniForegroundStyle(.blue)
                }
                .uniButtonStyle(.plain)
            }

            Section(header: Text("Account Details")) {
                HStack {
                    Text("Username")
                    Spacer()
                    Text("johndoe123")
                        .uniForegroundStyle(.secondary)
                }

                HStack {
                    Text("User ID")
                    Spacer()
                    Text("849302")
                        .uniForegroundStyle(.secondary)
                        .font(.monospacedDigit(.body)())
                }

                HStack {
                    Text("Joined")
                    Spacer()
                    Text("Feb 2024")
                        .uniForegroundStyle(.secondary)
                }
            }

            Section(header: Text("Subscription")) {
                HStack {
                    Text("Plan")
                    Spacer()
                    Text("Free")
                        .uniForegroundStyle(.secondary)
                }

                UniButton(action: {
                    // Upgrade action
                }) {
                    Text("Upgrade to Pro")
                        .uniForegroundStyle(.blue)
                }
                .uniButtonStyle(.plain)
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

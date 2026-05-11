import SwiftUI

struct AccountOverviewView: View {
    @State private var showingEditProfile = false
    
    var body: some View {
        List {
            Section {
                HStack(spacing: 16) {
                    Circle()
                        .fill(Color.gray.opacity(0.3))
                        .frame(width: 60, height: 60)
                        .overlay(
                            Image(systemName: "person.fill")
                                .font(.title)
                                .foregroundColor(.secondary)
                        )
                    
                    VStack(alignment: .leading, spacing: 4) {
                        Text("John Doe")
                            .font(.headline)
                        Text("john.doe@example.com")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                }
                .padding(.vertical, 8)
                
                Button(action: {
                    showingEditProfile = true
                }) {
                    Text("Edit Profile")
                        .foregroundColor(.blue)
                }
            }
            
            Section(header: Text("Account Details")) {
                HStack {
                    Text("Username")
                    Spacer()
                    Text("johndoe123")
                        .foregroundColor(.secondary)
                }
                
                HStack {
                    Text("User ID")
                    Spacer()
                    Text("849302")
                        .foregroundColor(.secondary)
                        .font(.monospacedDigit(.body)())
                }
                
                HStack {
                    Text("Joined")
                    Spacer()
                    Text("Feb 2024")
                        .foregroundColor(.secondary)
                }
            }
            
            Section(header: Text("Subscription")) {
                HStack {
                    Text("Plan")
                    Spacer()
                    Text("Free")
                        .foregroundColor(.secondary)
                }
                
                Button(action: {
                    // Upgrade action
                }) {
                    Text("Upgrade to Pro")
                        .foregroundColor(.blue)
                }
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

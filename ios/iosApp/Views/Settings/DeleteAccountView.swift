import ExploreSwiftUI
import SwiftUI

struct DeleteAccountView: View {
    @State private var showConfirmation = false
    @Environment(\.presentationMode) var presentationMode

    var body: some View {
        VStack(spacing: 24) {
            Image(systemName: "exclamationmark.shield.fill")
                .font(.system(size: 64))
                .uniForegroundStyle(.red)
                .padding(.top, 40)

            VStack(spacing: 12) {
                Text("Delete Account")
                    .font(.title2)
                    .fontWeight(.bold)

                Text("Are you sure you want to delete your account? This action cannot be undone.")
                    .font(.body)
                    .multilineTextAlignment(.center)
                    .uniForegroundStyle(.secondary)
                    .padding(.horizontal)
            }

            VStack(alignment: .leading, spacing: 16) {
                BulletPoint(text: "All your personal data will be permanently removed.")
                BulletPoint(text: "Your purchase history and subscriptions will be lost.")
                BulletPoint(text: "You will lose access to all your saved content.")
            }
            .padding()
            .background(Color.gray.opacity(0.1))
            .cornerRadius(12)
            .padding(.horizontal)

            Spacer()

            UniButton(action: {
                showConfirmation = true
            }) {
                Text("Delete My Account")
                    .font(.headline)
                    .uniForegroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.red)
                    .cornerRadius(12)
            }
            .uniButtonStyle(.plain)
            .padding(.horizontal, 32)
            .padding(.bottom, 20)
        }
        .navigationTitle("Delete Account")
        .navigationBarTitleDisplayMode(.inline)
        .uniAlert("Final Confirmation", isPresented: $showConfirmation) {
            Button("Delete Forever", role: .destructive) {
                // Actual delete logic here
                presentationMode.wrappedValue.dismiss()
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This is strictly permanent. Are you absolutely sure?")
        }
    }
}

struct BulletPoint: View {
    let text: String

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Circle()
                .fill(Color.red)
                .frame(width: 6, height: 6)
                .padding(.top, 8)

            Text(text)
                .font(.subheadline)
                .uniForegroundStyle(.primary)
        }
    }
}

#Preview {
    NavigationView {
        DeleteAccountView()
    }
}

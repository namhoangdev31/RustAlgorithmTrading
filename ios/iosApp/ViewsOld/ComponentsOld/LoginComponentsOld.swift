import SwiftUI
// import Shared — replaced by native Swift Shared module

struct LoginHeaderViewOld: View {
    var body: some View {
        Text("Welcome Back")
            .font(.largeTitle)
            .fontWeight(.bold)
            .foregroundColor(.primary)
    }
}

struct LoginFormViewOld: View {
    @Binding var email: String
    @Binding var password: String

    var body: some View {
        VStack(spacing: 16) {
            TextField("Email", text: $email)
                .keyboardType(.emailAddress)
                .autocapitalization(.none)
                .nativeInputField() // Replaces .glassEffect()

            SecureField("Password", text: $password)
                .nativeInputField() // Replaces .glassEffect()
        }
    }
}

struct LoginButtonViewOld: View {
    let action: () -> Void
    let isLoading: Bool

    var body: some View {
        Button(action: action) {
            ZStack {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                } else {
                    Text("Login")
                        .fontWeight(.semibold)
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 50)
            .background(Color.blue)
            .cornerRadius(12)
            // Adding a glass overlay for "premium" feel
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.white.opacity(0.3), lineWidth: 1)
            )
        }
        .disabled(isLoading)
        .shadow(radius: 5)
    }
}

struct LiquidGlassDemoCardOld: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Native iOS Frosted Glass")
                .font(.headline)
                .foregroundColor(.primary)

            Text("This card showcases native backward-compatible materials imitating the iOS 26+ depth and motion.")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .frostedCard(cornerRadius: 16) // Replaces .glassEffect()
    }
}

import ExploreSwiftUI
import SwiftUI

struct LoginHeaderView: View {
    var body: some View {
        Text("Welcome Back")
            .font(.largeTitle)
            .fontWeight(.bold)
            .uniForegroundStyle(.primary)
    }
}

struct LoginFormView: View {
    @Binding var email: String
    @Binding var password: String

    var body: some View {
        VStack(spacing: 16) {
            TextField("Email", text: $email)
                .padding()
                .padding()
                .background(.clear)
                .uniGlass(cornerRadius: 16)
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .autocapitalization(.none)
                .keyboardType(.emailAddress)

            SecureField("Password", text: $password)
                .padding()
                .padding()
                .background(.clear)
                .uniGlass(cornerRadius: 16)
                .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }
}

struct LoginButtonView: View {
    let action: () -> Void
    let isLoading: Bool

    var body: some View {
        UniButton(action: action) {
            ZStack {
                if isLoading {
                    UniProgressView()
                        .uniProgressTint(.white)
                } else {
                    Text("Login")
                        .fontWeight(.semibold)
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 50)
            .background(Color.blue)
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.white.opacity(0.3), lineWidth: 1)
            )
        }
        .disabled(isLoading)
        .shadow(radius: 5)
    }
}

struct LiquidGlassDemoCard: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Native iOS Liquid Glass")
                .font(.headline)
                .uniForegroundStyle(.primary)

            Text("This card showcases the new API features for iOS 26+ including depth and motion.")
                .font(.subheadline)
                .uniForegroundStyle(.secondary)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.clear)
        .uniGlass(cornerRadius: 16)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

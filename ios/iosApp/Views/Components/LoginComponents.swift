import AuthenticationServices
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

struct OAuthLoginButtonsView: View {
    let isLoading: Bool
    let configureAppleRequest: (ASAuthorizationAppleIDRequest) -> Void
    let appleCompletion: (Result<ASAuthorization, Error>) -> Void
    let googleAction: () -> Void

    var body: some View {
        VStack(spacing: 16) {
            SignInWithAppleButton(.continue, onRequest: configureAppleRequest, onCompletion: appleCompletion)
                .signInWithAppleButtonStyle(.black)
                .frame(maxWidth: .infinity)
                .frame(height: 50)
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .disabled(isLoading)

            GoogleLoginButtonView(action: googleAction, isLoading: isLoading)
        }
    }
}

struct GoogleLoginButtonView: View {
    let action: () -> Void
    let isLoading: Bool

    var body: some View {
        UniButton(action: action) {
            HStack(spacing: 10) {
                if isLoading {
                    UniProgressView()
                        .uniProgressTint(.primary)
                } else {
                    Text("G")
                        .fontWeight(.semibold)
                    Text("Continue with Google")
                        .fontWeight(.semibold)
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 50)
            .background(Color.white)
            .foregroundStyle(Color.black)
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.black.opacity(0.16), lineWidth: 1)
            )
        }
        .disabled(isLoading)
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

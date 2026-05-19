import ExploreSwiftUI
import SwiftUI

struct ForgotPasswordView: View {
    @EnvironmentObject var navigation: NavigationViewModel
    @State private var email: String = ""
    @State private var isLoading: Bool = false
    @State private var isSuccess: Bool = false
    @State private var errorMessage: String? = nil

    var body: some View {
        VStack(spacing: 24) {
            Spacer().frame(height: 40)

            Image(systemName: "lock.rotation")
                .font(.system(size: 60))
                .uniForegroundStyle(.blue)

            Text("Forgot Password?")
                .font(.largeTitle)
                .fontWeight(.bold)

            Text("Enter your email address to receive a password reset link.")
                .font(.body)
                .uniForegroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)

            if isSuccess {
                VStack(spacing: 16) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.largeTitle)
                        .uniForegroundStyle(.green)

                    Text("Check your email!")
                        .font(.headline)
                        .uniForegroundStyle(.primary)

                    Text("We have sent a password reset link to \(email).")
                        .font(.caption)
                        .uniForegroundStyle(.secondary)
                        .multilineTextAlignment(.center)

                    UniButton(action: {
                        navigation.goBack()
                    }) {
                        Text("Back to Login")
                    }
                    .uniButtonStyle(.plain)
                    .uniForegroundStyle(.blue)
                    .padding(.top)
                }
                .padding()
                .uniGlass(cornerRadius: 12)
                .transition(.scale.combined(with: .opacity))
            } else {
                VStack(spacing: 16) {
                    TextField("Email Address", text: $email)
                        .keyboardType(.emailAddress)  // iOS 26 might use different modifier, keeping standard
                        .autocapitalization(.none)  // Deprecated in favor of textInputAutocapitalization, but keeping compat
                        .padding()
                        .uniGlass(cornerRadius: 12)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color.primary.opacity(0.1), lineWidth: 1)
                        )

                    if let errorMessage = errorMessage {
                        Text(errorMessage)
                            .uniForegroundStyle(.red)
                            .font(.caption)
                    }

                    UniButton(action: resetPassword) {
                        if isLoading {
                            UniProgressView()
                                .uniProgressTint(.white)
                        } else {
                            Text("Send Reset Link")
                                .fontWeight(.bold)
                        }
                    }
                    .uniButtonStyle(.plain)
                    .uniForegroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 54)
                    .background(email.isEmpty ? Color.gray : Color.blue)
                    .cornerRadius(12)
                    .disabled(email.isEmpty || isLoading)
                }
            }

            Spacer()
        }
        .padding()
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func resetPassword() {
        guard !email.isEmpty else { return }

        isLoading = true
        errorMessage = nil

        // Simulate network delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            isLoading = false
            if email.contains("@") {
                withAnimation {
                    isSuccess = true
                }
            } else {
                errorMessage = "Please enter a valid email address."
            }
        }
    }
}

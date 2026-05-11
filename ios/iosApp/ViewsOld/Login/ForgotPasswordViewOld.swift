import SwiftUI
// import Shared — replaced by native Swift Shared module

struct ForgotPasswordViewOld: View {
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
                .foregroundColor(.blue)
            
            Text("Forgot Password?")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            Text("Enter your email address to receive a password reset link.")
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
            
            if isSuccess {
                VStack(spacing: 16) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.largeTitle)
                        .foregroundColor(.green)
                    
                    Text("Check your email!")
                        .font(.headline)
                        .foregroundColor(.primary)
                    
                    Text("We have sent a password reset link to \(email).")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                    
                    Button("Back to Login") {
                        navigation.goBack()
                    }
                    .padding(.top)
                }
                .padding()
                .background(Color.green.opacity(0.1))
                .cornerRadius(12)
                .transition(.scale.combined(with: .opacity))
            } else {
                VStack(spacing: 16) {
                    TextField("Email Address", text: $email)
                        .keyboardType(.emailAddress) // iOS 26 might use different modifier, keeping standard
                        .autocapitalization(.none) // Deprecated in favor of textInputAutocapitalization, but keeping compat
                        .padding()
                        .background(Color(.systemGray6))
                        .cornerRadius(12)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                        )
                    
                    if let errorMessage = errorMessage {
                        Text(errorMessage)
                            .foregroundColor(.red)
                            .font(.caption)
                    }
                    
                    Button(action: resetPassword) {
                        if isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        } else {
                            Text("Send Reset Link")
                                .fontWeight(.bold)
                        }
                    }
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
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

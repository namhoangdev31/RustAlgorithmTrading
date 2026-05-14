import SwiftUI

struct LoginView: View {
    @StateObject private var viewModel: LoginViewModel
    @EnvironmentObject var navigation: NavigationViewModel
    @Namespace private var animation // For matchedGeometryEffect if needed
    
    init(viewModel: LoginViewModel) {
        _viewModel = StateObject(wrappedValue: viewModel)
    }
    
    var body: some View {
        ZStack {
            // Background
            Color.white.ignoresSafeArea()
            
            ScrollView {
                VStack(spacing: 30) {
                    Spacer().frame(height: 40)
                    
                    LoginHeaderView()
                        .transition(.slide)
                    
                    VStack(spacing: 24) {
                        LoginFormView(email: $viewModel.email, password: $viewModel.password)
                        
                        if let error = viewModel.error {
                            Text(error)
                                .foregroundColor(.red)
                                .font(.caption)
                                .transition(.opacity)
                        }
                        
                        LoginButtonView(action: {
                            Task { await viewModel.login() }
                        }, isLoading: viewModel.isLoading)
                        
                        Button(action: {
                            navigation.navigate(to: .forgotPassword)
                        }) {
                            Text("Forgot Password?")
                                .font(.caption)
                                .foregroundColor(.blue)
                        }
                    }
                    .padding(.horizontal)
                    
                    Spacer().frame(height: 20)
                    
                    LiquidGlassDemoCard()
                        .padding(.horizontal)
                }
                .padding()
                .animation(.spring(), value: viewModel.isLoading) // Smooth state changes
            }
        }
        .fullScreenCover(isPresented: $viewModel.isLoggedIn) {
            Text("Home Screen (Logged In)")
        }
    }
}

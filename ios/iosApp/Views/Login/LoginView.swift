import ExploreSwiftUI
import AuthenticationServices
import SwiftUI

struct LoginView: View {
    @StateObject private var viewModel: LoginViewModel
    @EnvironmentObject var navigation: NavigationViewModel
    @AppStorage("isLoggedIn") private var isLoggedIn = false
    @Namespace private var animation  // For matchedGeometryEffect if needed

    init(viewModel: LoginViewModel) {
        _viewModel = StateObject(wrappedValue: viewModel)
    }

    var body: some View {
        ZStack {
            // Background
            Color.white.ignoresSafeArea()

            UniScrollView {
                VStack(spacing: 30) {
                    Spacer().frame(height: 40)

                    LoginHeaderView()
                        .transition(.slide)

                    VStack(spacing: 24) {
                        OAuthLoginButtonsView(
                            isLoading: viewModel.isLoading,
                            configureAppleRequest: viewModel.configureAppleRequest,
                            appleCompletion: { result in
                                Task { await viewModel.loginWithApple(result) }
                            },
                            googleAction: {
                                Task { await viewModel.loginWithGoogle() }
                            }
                        )

                        if let error = viewModel.error {
                            Text(error)
                                .uniForegroundStyle(.red)
                                .font(.caption)
                                .transition(.opacity)
                        }

                    }
                    .padding(.horizontal)

                    Spacer().frame(height: 20)

                    LiquidGlassDemoCard()
                        .padding(.horizontal)
                }
                .padding()
                .animation(.spring(), value: viewModel.isLoading)  // Smooth state changes
            }
        }
        .onChange(of: viewModel.isLoggedIn) { _, loggedIn in
            guard loggedIn else { return }
            isLoggedIn = true
            navigation.goBack()
        }
    }
}

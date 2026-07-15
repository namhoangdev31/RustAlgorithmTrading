import AuthenticationServices
import Foundation

@MainActor
class LoginViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var error: String? = nil
    @Published var isLoggedIn = false
    
    private let loginUseCase: LoginUseCase
    private let firebaseOAuthService: FirebaseOAuthService
    
    init(loginUseCase: LoginUseCase, firebaseOAuthService: FirebaseOAuthService) {
        self.loginUseCase = loginUseCase
        self.firebaseOAuthService = firebaseOAuthService
    }
    
    func configureAppleRequest(_ request: ASAuthorizationAppleIDRequest) {
        firebaseOAuthService.configureAppleRequest(request)
    }

    func loginWithApple(_ result: Result<ASAuthorization, Error>) async {
        await performOAuthLogin {
            try await firebaseOAuthService.signInWithApple(result: result)
        }
    }

    func loginWithGoogle() async {
        await performOAuthLogin {
            try await firebaseOAuthService.signInWithGoogle()
        }
    }

    private func performOAuthLogin(_ idTokenProvider: () async throws -> String) async {
        guard !isLoading else { return }
        isLoading = true
        error = nil

        do {
            let idToken = try await idTokenProvider()
            let result = await loginUseCase.loginWithFirebase(idToken: idToken)
            applyLoginResult(result)
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    private func applyLoginResult(_ result: AppResult<AuthTokenResponse>) {
        if result.isSuccess {
            isLoggedIn = true
            return
        }

        if let appError = result.error {
            error = message(for: appError)
        } else {
            error = "Unknown login error"
        }
    }

    private func message(for error: AppError) -> String {
        switch error {
        case .networkError(let message, _):
            return message ?? "Network error"
        case .serverError(_, let message):
            return message ?? "Server error"
        case .databaseError(let message, _):
            return message ?? "Database error"
        case .unknownError(let message, _):
            return message ?? "Unknown error"
        case .validationError(let message):
            return message ?? "Validation error"
        }
    }
}

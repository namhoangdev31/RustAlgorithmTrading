import Foundation

@MainActor
class LoginViewModel: ObservableObject {
    @Published var email = ""
    @Published var password = ""
    @Published var isLoading = false
    @Published var error: String? = nil
    @Published var isLoggedIn = false
    
    private let loginUseCase: LoginUseCase
    
    init(loginUseCase: LoginUseCase) {
        self.loginUseCase = loginUseCase
    }
    
    func login() async {
        isLoading = true
        error = nil
        
        let result = await loginUseCase.login(email: email, password: password)

        if result.isSuccess {
            if result.data == true {
                isLoggedIn = true
            } else {
                error = "Login failed"
            }
        } else if let appError = result.error {
            error = message(for: appError)
        } else {
            error = "Unknown login error"
        }

        isLoading = false
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

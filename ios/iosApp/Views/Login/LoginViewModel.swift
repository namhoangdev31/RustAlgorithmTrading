import Foundation
import Shared // Assuming framework name is Shared. If it was ComposeApp, we might need to change implementation

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
        
        do {
            let result = try await loginUseCase.execute(email: email, password: password)
            
            if let success = result as? DomainResultSuccess<KotlinBoolean> {
                // Assuming data is KotlinBoolean or plain Bool depending on interop
                // For simplicity, treating existence of success as true since login returns Boolean
                let isSuccess = success.data?.boolValue ?? false
                if isSuccess {
                    isLoggedIn = true
                } else {
                    self.error = "Login failed"
                }
            } else if let errorResult = result as? DomainResultError {
                self.error = errorResult.message
            } else {
                 self.error = "Unknown result type"
            }
            
            isLoading = false
        } catch {
            isLoading = false
            self.error = error.localizedDescription
        }
    }
}

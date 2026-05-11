import Foundation

/// Replaces KMP AppResult<T> for iOS standalone
enum AppResult<T> {
    case success(T)
    case error(AppError)
    
    var isSuccess: Bool {
        if case .success = self { return true }
        return false
    }
    
    var data: T? {
        if case .success(let value) = self { return value }
        return nil
    }
}

/// Replaces KMP Shared.AppError
enum AppError: Error {
    case networkError(message: String? = nil, cause: Error? = nil)
    case serverError(code: Int, message: String? = nil)
    case databaseError(message: String? = nil, cause: Error? = nil)
    case unknownError(message: String? = nil, cause: Error? = nil)
    case validationError(message: String?)
}

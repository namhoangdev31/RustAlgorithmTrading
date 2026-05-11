import Foundation

struct AuthTokenResponse: Codable {
    let accessToken: String
    let refreshToken: String
    let expiresIn: Int?
}

struct DomainResult<T> {
    let data: T?
    let error: AppError?
    let isSuccess: Bool
    
    static func success(_ data: T) -> DomainResult<T> {
        DomainResult(data: data, error: nil, isSuccess: true)
    }
    
    static func failure(_ error: AppError) -> DomainResult<T> {
        DomainResult(data: nil, error: error, isSuccess: false)
    }
}

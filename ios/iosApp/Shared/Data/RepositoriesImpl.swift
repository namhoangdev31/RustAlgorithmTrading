import Foundation

// MARK: - API Response Types

struct DownloadUrlResponse: Codable {
    let downloadUrl: String
}

struct EmptyResponse: Codable {}

// MARK: - Repository Implementations

class BundleRepositoryImpl: BundleRepository {
    private let apiService: ApiService
    
    init(apiService: ApiService) {
        self.apiService = apiService
    }
    
    func getBundles() async -> AppResult<[Bundle_]> {
        do {
            let bundles: [Bundle_] = try await apiService.request("bundles")
            return .success(bundles)
        } catch let appError as AppError {
            return .error(appError)
        } catch {
            return .error(.unknownError(message: error.localizedDescription, cause: error))
        }
    }
    
    func getDownloadUrl(bundleId: String) async -> AppResult<String> {
        do {
            let response: DownloadUrlResponse = try await apiService.request("bundles/\(bundleId)/download-url")
            return .success(response.downloadUrl)
        } catch let appError as AppError {
            return .error(appError)
        } catch {
            return .error(.unknownError(message: error.localizedDescription, cause: error))
        }
    }
    
    func getBundleStats(bundleId: String) async -> AppResult<BundleStats?> {
        do {
            let stats: BundleStats = try await apiService.request("bundles/\(bundleId)/stats")
            return .success(stats)
        } catch let appError as AppError {
            return .error(appError)
        } catch {
            return .error(.unknownError(message: error.localizedDescription, cause: error))
        }
    }
    
    func getBundlePromotions(bundleId: String) async -> AppResult<[BundlePromotion]> {
        do {
            let promotions: [BundlePromotion] = try await apiService.request("bundles/\(bundleId)/promotions")
            return .success(promotions)
        } catch let appError as AppError {
            return .error(appError)
        } catch {
            return .error(.unknownError(message: error.localizedDescription, cause: error))
        }
    }
    
    func trackDownload(bundleId: String) async -> AppResult<Void> {
        do {
            let _: EmptyResponse = try await apiService.request("bundles/\(bundleId)/download/track", method: "POST")
            return .success(())
        } catch let appError as AppError {
            return .error(appError)
        } catch {
            return .error(.unknownError(message: error.localizedDescription, cause: error))
        }
    }
}

class TodayRepositoryImpl: TodayRepository {
    private let apiService: ApiService
    
    init(apiService: ApiService) {
        self.apiService = apiService
    }
    
    func getFeaturedApp() async -> AppResult<FeaturedApp> {
        do {
            let featured: FeaturedApp = try await apiService.request("discovery/featured")
            return .success(featured)
        } catch let appError as AppError {
            return .error(appError)
        } catch {
            return .error(.unknownError(message: error.localizedDescription, cause: error))
        }
    }
    
    func getAppsWeLove() async -> AppResult<[MiniApp]> {
        do {
            let apps: [MiniApp] = try await apiService.request("discovery/apps-we-love")
            return .success(apps)
        } catch let appError as AppError {
            return .error(appError)
        } catch {
            return .error(.unknownError(message: error.localizedDescription, cause: error))
        }
    }
    
    func getTopCollections() async -> AppResult<[AppCollection]> {
        do {
            let collections: [AppCollection] = try await apiService.request("discovery/collections")
            return .success(collections)
        } catch let appError as AppError {
            return .error(appError)
        } catch {
            return .error(.unknownError(message: error.localizedDescription, cause: error))
        }
    }
    
    func getPersonalizedApps() async -> AppResult<[MiniApp]> {
        do {
            let apps: [MiniApp] = try await apiService.request("discovery/personalized")
            return .success(apps)
        } catch let appError as AppError {
            return .error(appError)
        } catch {
            return .error(.unknownError(message: error.localizedDescription, cause: error))
        }
    }
}

class LoginRepositoryImpl: LoginRepository {
    private let tokenStorage: TokenStorage
    private let apiService: ApiService
    
    private struct FirebaseLoginRequest: Codable {
        let idToken: String
    }
    
    private struct RefreshTokenRequest: Codable {
        let refreshToken: String
    }
    
    init(apiService: ApiService, tokenStorage: TokenStorage) {
        self.apiService = apiService
        self.tokenStorage = tokenStorage
    }
    
    func loginWithFirebase(idToken: String) async -> AppResult<AuthTokenResponse> {
        do {
            let body = try JSONEncoder().encode(FirebaseLoginRequest(idToken: idToken))
            let response: AuthTokenResponse = try await apiService.request("auth/firebase", method: "POST", body: body)
            await saveTokens(accessToken: response.accessToken, refreshToken: response.refreshToken)
            return .success(response)
        } catch let appError as AppError {
            return .error(appError)
        } catch {
            return .error(.unknownError(message: error.localizedDescription, cause: error))
        }
    }
    
    func refreshAccessToken(refreshToken: String) async -> AppResult<AuthTokenResponse> {
        do {
            let body = try JSONEncoder().encode(RefreshTokenRequest(refreshToken: refreshToken))
            let response: AuthTokenResponse = try await apiService.request("auth/refresh", method: "POST", body: body)
            await saveTokens(accessToken: response.accessToken, refreshToken: response.refreshToken)
            return .success(response)
        } catch let appError as AppError {
            return .error(appError)
        } catch {
            return .error(.unknownError(message: error.localizedDescription, cause: error))
        }
    }
    
    func getAccessToken() async -> String? { tokenStorage.get(key: "access_token") }
    func getRefreshToken() async -> String? { tokenStorage.get(key: "refresh_token") }
    
    func saveTokens(accessToken: String, refreshToken: String) async {
        tokenStorage.save(key: "access_token", value: accessToken)
        tokenStorage.save(key: "refresh_token", value: refreshToken)
    }
    
    func clearTokens() async {
        tokenStorage.clear()
    }
}

class UserRepositoryImpl: UserRepository {
    private let apiService: ApiService
    
    init(apiService: ApiService) {
        self.apiService = apiService
    }
    
    func getUsers() async -> AppResult<[User]> {
        do {
            let users: [User] = try await apiService.request("users")
            return .success(users)
        } catch let appError as AppError {
            return .error(appError)
        } catch {
            return .error(.unknownError(message: error.localizedDescription, cause: error))
        }
    }
}

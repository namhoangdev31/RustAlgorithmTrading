import Foundation

// MARK: - Mock Repository Implementations
// These replace the KMP shared repository implementations for iOS standalone.
// In production, they should be connected to a real API backend.

class MockBundleRepository: BundleRepository {
    private let apiService: ApiService
    
    init(apiService: ApiService) {
        self.apiService = apiService
    }
    
    func getBundles() async -> AppResult<[Bundle_]> {
        // Mock data — replace with real API calls
        return .success([])
    }
    
    func getDownloadUrl(bundleId: String) async -> AppResult<String> {
        return .success("\(AppConfig.apiBaseUrl)bundles/\(bundleId)/download")
    }
    
    func getBundleStats(bundleId: String) async -> AppResult<BundleStats?> {
        return .success(nil)
    }
    
    func getBundlePromotions(bundleId: String) async -> AppResult<[BundlePromotion]> {
        return .success([])
    }
    
    func trackDownload(bundleId: String) async -> AppResult<Void> {
        return .success(())
    }
}

class MockTodayRepository: TodayRepository {
    private let apiService: ApiService
    
    init(apiService: ApiService) {
        self.apiService = apiService
    }
    
    func getFeaturedApp() async -> DomainResult<FeaturedApp> {
        return .success(FeaturedApp(
            id: "featured-1",
            processedId: "featured-1",
            badge: "NEW",
            title: "Featured App",
            subtitle: "Discover something new",
            backgroundImageUrl: ""
        ))
    }
    
    func getAppsWeLove() async -> DomainResult<[MiniApp]> {
        return .success([])
    }
    
    func getTopCollections() async -> DomainResult<[AppCollection]> {
        return .success([])
    }
    
    func getPersonalizedApps() async -> DomainResult<[MiniApp]> {
        return .success([])
    }
}

class MockLoginRepository: LoginRepository {
    private let tokenStorage: TokenStorage
    private let apiService: ApiService
    
    init(apiService: ApiService, tokenStorage: TokenStorage) {
        self.apiService = apiService
        self.tokenStorage = tokenStorage
    }
    
    func login(email: String, password: String) async -> DomainResult<Bool> {
        return .success(true)
    }
    
    func loginWithFirebase(idToken: String) async -> DomainResult<AuthTokenResponse> {
        return .success(AuthTokenResponse(accessToken: "", refreshToken: "", expiresIn: 3600))
    }
    
    func refreshAccessToken(refreshToken: String) async -> DomainResult<AuthTokenResponse> {
        return .success(AuthTokenResponse(accessToken: "", refreshToken: "", expiresIn: 3600))
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

class MockUserRepository: UserRepository {
    private let apiService: ApiService
    
    init(apiService: ApiService) {
        self.apiService = apiService
    }
    
    func getUsers() async -> AppResult<[User]> {
        return .success([])
    }
}

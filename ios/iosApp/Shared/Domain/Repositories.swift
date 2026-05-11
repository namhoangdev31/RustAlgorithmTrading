import Foundation

/// Replaces KMP BundleDownloader protocol
protocol BundleDownloader {
    func download(url: String, bundleId: String) async -> AppResult<String>
}

/// Replaces KMP Bundle_Repository
protocol BundleRepository {
    func getBundles() async -> AppResult<[Bundle_]>
    func getDownloadUrl(bundleId: String) async -> AppResult<String>
    func getBundleStats(bundleId: String) async -> AppResult<BundleStats?>
    func getBundlePromotions(bundleId: String) async -> AppResult<[BundlePromotion]>
    func trackDownload(bundleId: String) async -> AppResult<Void>
}

/// Replaces KMP Shared.TodayRepository
protocol TodayRepository {
    func getFeaturedApp() async -> DomainResult<FeaturedApp>
    func getAppsWeLove() async -> DomainResult<[MiniApp]>
    func getTopCollections() async -> DomainResult<[AppCollection]>
    func getPersonalizedApps() async -> DomainResult<[MiniApp]>
}

/// Replaces KMP Shared.LoginRepository
protocol LoginRepository {
    func login(email: String, password: String) async -> DomainResult<Bool>
    func loginWithFirebase(idToken: String) async -> DomainResult<AuthTokenResponse>
    func refreshAccessToken(refreshToken: String) async -> DomainResult<AuthTokenResponse>
    func getAccessToken() async -> String?
    func getRefreshToken() async -> String?
    func saveTokens(accessToken: String, refreshToken: String) async
    func clearTokens() async
}

/// Replaces KMP Shared.UserRepository
protocol UserRepository {
    func getUsers() async -> AppResult<[User]>
}

// MARK: - Supplementary Types

struct BundleStats: Codable {
    let totalDownloads: Int64
    let activeInstalls: Int64
    let averageRating: Double
    let totalRatings: Int
}

struct BundlePromotion: Codable, Identifiable {
    let id: String
    let bundleId: String
    let code: String
    let discountPercent: Double
    let maxUses: Int
    let currentUses: Int
    let expiresAt: Date?
    let isActive: Bool
}

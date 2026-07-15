import Foundation

protocol BundleDownloader {
    func download(url: String, bundleId: String) async -> AppResult<String>
}

protocol BundleRepository {
    func getBundles() async -> AppResult<[Bundle_]>
    func getDownloadUrl(bundleId: String) async -> AppResult<String>
    func getBundleStats(bundleId: String) async -> AppResult<BundleStats?>
    func getBundlePromotions(bundleId: String) async -> AppResult<[BundlePromotion]>
    func trackDownload(bundleId: String) async -> AppResult<Void>
}

protocol TodayRepository {
    func getFeaturedApp() async -> AppResult<FeaturedApp>
    func getAppsWeLove() async -> AppResult<[MiniApp]>
    func getTopCollections() async -> AppResult<[AppCollection]>
    func getPersonalizedApps() async -> AppResult<[MiniApp]>
}

protocol LoginRepository {
    func loginWithFirebase(idToken: String) async -> AppResult<AuthTokenResponse>
    func refreshAccessToken(refreshToken: String) async -> AppResult<AuthTokenResponse>
    func getAccessToken() async -> String?
    func getRefreshToken() async -> String?
    func saveTokens(accessToken: String, refreshToken: String) async
    func clearTokens() async
}

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

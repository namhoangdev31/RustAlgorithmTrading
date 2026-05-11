import Foundation

// MARK: - Navigation Routes (replaces KMP Route enum)

enum Route: Hashable {
    case home
    case search
    case library
    case profile
    case login
    case forgotPassword
    case onboarding
    case miniAppDetails(bundleId: String)
    case miniAppStore
    case settings
    case webRuntime(bundleId: String, bundlePath: String)
    case notifications
    case notificationDetail(id: String)
    case wallet
    case paymentMethods
    case addCard
    case connectWallet
    case verification
    case paymentResult
    case editProfile
    case accountOverview
    case securitySettings
    case deviceManagement
    case downloadHistory
    case helpSupport
    case aboutApp
    case legal
    case deleteAccount
    case allReviews(bundleId: String)
    case reviewDetail(reviewId: String)
    case writeReview(bundleId: String)
    case reportReview(reviewId: String)
    case reviewGuidelines
    case wishlist
    case updates
    case installProgress(bundleId: String)
    case appStorage(bundleId: String)
    case permissions(bundleId: String)
    case versionHistory(bundleId: String)
    case checkout(bundleId: String)
    case forYou
    case discovery
    case topCharts
    case categoryDetail(categoryId: String)
}

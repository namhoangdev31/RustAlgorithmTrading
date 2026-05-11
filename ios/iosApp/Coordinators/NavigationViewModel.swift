import SwiftUI
// import Shared — replaced by native Swift Shared module

enum AppRoute: Hashable, Identifiable {
    case login
    case home
    case profile(userId: String)
    case detail(itemId: String)
    case miniApp(manifest: WebRuntimeManifest, path: String)
    case activity
    case editorChoice
    case collection(id: String, title: String)
    case updates
    case categoryDetail(id: String, title: String)
    case topCharts
    case myReviews
    case notificationPreferences
    case settings
    case editProfile
    case downloadHistory
    case writeReview(appId: String)
    case developer(id: String)
    case allReviews(appId: String)
    case forgotPassword
    case forYou
    
    // Batch 1: System & Lifecycle
    case globalError
    case noInternet
    case forceUpdate
    case rateLimit
    case installProgress(appId: String)
    case appStorage(appId: String)
    case versionHistory(appId: String)
    case permissions(appId: String)
    
    // Batch 2: Account
    case accountOverview
    case devices
    case security
    case deleteAccount
    
    // Batch 3: Engagement
    case notifications
    case notificationDetail(id: String)
    case reviewDetail(id: String)
    case reportReview
    case reviewGuidelines
    
    // Tier 3: Support
    case helpSupport
    case aboutApp
    case legal(type: String)
    case checkout(appId: String, price: Double)
    case paymentMethods
    case addCard
    case connectWallet
    case verification
    case paymentSuccess
    case paymentFailed
    case wallet

    var id: String {
        switch self {
        case .writeReview(let id): return "writeReview-\(id)"
        case .login: return "login"
        case .home: return "home"
        case .profile(let id): return "profile-\(id)"
        case .detail(let id): return "detail-\(id)"
        case .miniApp(let m, let p): return "miniApp-\(m.id)-\(p)"
        case .activity: return "activity"
        case .editorChoice: return "editorChoice"
        case .collection(let id, _): return "collection-\(id)"
        case .updates: return "updates"
        case .categoryDetail(let id, _): return "categoryDetail-\(id)"
        case .topCharts: return "topCharts"
        case .myReviews: return "myReviews"
        case .notificationPreferences: return "notificationPreferences"
        case .settings: return "settings"
        case .editProfile: return "editProfile"
        case .downloadHistory: return "downloadHistory"
        case .developer(let id): return "developer-\(id)"
        case .allReviews(let id): return "allReviews-\(id)"
        case .forgotPassword: return "forgotPassword"
        case .forYou: return "forYou"
        case .globalError: return "globalError"
        case .noInternet: return "noInternet"
        case .forceUpdate: return "forceUpdate"
        case .rateLimit: return "rateLimit"
        case .installProgress(let id): return "installProgress-\(id)"
        case .appStorage(let id): return "appStorage-\(id)"
        case .versionHistory(let id): return "versionHistory-\(id)"
        case .permissions(let id): return "permissions-\(id)"
        case .accountOverview: return "accountOverview"
        case .devices: return "devices"
        case .security: return "security"
        case .deleteAccount: return "deleteAccount"
        case .notifications: return "notifications"
        case .notificationDetail(let id): return "notificationDetail-\(id)"
        case .reviewDetail(let id): return "reviewDetail-\(id)"
        case .reportReview: return "reportReview"
        case .reviewGuidelines: return "reviewGuidelines"
        case .helpSupport: return "helpSupport"
        case .aboutApp: return "aboutApp"
        case .legal(let type): return "legal-\(type)"
        case .checkout(let id, _): return "checkout-\(id)"
        case .paymentMethods: return "paymentMethods"
        case .addCard: return "addCard"
        case .connectWallet: return "connectWallet"
        case .verification: return "verification"
        case .paymentSuccess: return "paymentSuccess"
        case .paymentFailed: return "paymentFailed"
        case .wallet: return "wallet"
        }
    }

    func hash(into hasher: inout Hasher) {
        switch self {
        case .login: hasher.combine(0)
        case .home: hasher.combine(1)
        case .profile(let id): hasher.combine(id)
        case .detail(let id): hasher.combine(id)
        case .miniApp(let manifest, let path):
            hasher.combine(manifest.id)
            hasher.combine(path)
        case .activity: hasher.combine(2)
        case .editorChoice: hasher.combine(3)
        case .collection(let id, _): hasher.combine(id)
        case .updates: hasher.combine(4)
        case .categoryDetail(let id, _): hasher.combine(id)
        case .topCharts: hasher.combine(5)
        case .myReviews: hasher.combine(6)
        case .notificationPreferences: hasher.combine(7)
        case .settings: hasher.combine(8)
        case .editProfile: hasher.combine(9)
        case .downloadHistory: hasher.combine(10)
        case .writeReview(let id): hasher.combine(id)
        case .developer(let id): hasher.combine(id)
        case .allReviews(let id): hasher.combine(id)
        case .forgotPassword: hasher.combine(11)
        case .forYou: hasher.combine(12)
        case .globalError: hasher.combine(12)
        case .noInternet: hasher.combine(13)
        case .forceUpdate: hasher.combine(14)
        case .rateLimit: hasher.combine(15)
        case .installProgress(let id): hasher.combine(id)
        case .appStorage(let id): hasher.combine(id)
        case .versionHistory(let id): hasher.combine(id)
        case .permissions(let id): hasher.combine(id)
        case .accountOverview: hasher.combine(16)
        case .devices: hasher.combine(17)
        case .security: hasher.combine(18)
        case .deleteAccount: hasher.combine(19)
        case .notifications: hasher.combine(20)
        case .notificationDetail(let id): hasher.combine(id)
        case .reviewDetail(let id): hasher.combine(id)
        case .reportReview: hasher.combine(21)
        case .reviewGuidelines: hasher.combine(22)
        case .helpSupport: hasher.combine(23)
        case .aboutApp: hasher.combine(24)
        case .legal(let type): hasher.combine(type)
        case .checkout(let appId, _): hasher.combine(appId)
        case .paymentMethods: hasher.combine(25)
        case .addCard: hasher.combine(26)
        case .connectWallet: hasher.combine(27)
        case .verification: hasher.combine(28)
        case .paymentSuccess: hasher.combine(29)
        case .paymentFailed: hasher.combine(30)
        case .wallet: hasher.combine(31)
        }
    }

    static func == (lhs: AppRoute, rhs: AppRoute) -> Bool {
        switch (lhs, rhs) {
        case (.login, .login): return true
        case (.home, .home): return true
        case (.profile(let a), .profile(let b)): return a == b
        case (.detail(let a), .detail(let b)): return a == b
        case (.miniApp(let ma, let pa), .miniApp(let mb, let pb)):
            return ma.id == mb.id && pa == pb
        case (.activity, .activity): return true
        case (.editorChoice, .editorChoice): return true
        case (.collection(let a, _), .collection(let b, _)): return a == b
        case (.updates, .updates): return true
        case (.categoryDetail(let a, _), .categoryDetail(let b, _)): return a == b
        case (.topCharts, .topCharts): return true
        case (.myReviews, .myReviews): return true
        case (.notificationPreferences, .notificationPreferences): return true
        case (.settings, .settings): return true
        case (.editProfile, .editProfile): return true
        case (.downloadHistory, .downloadHistory): return true
        case (.writeReview(let a), .writeReview(let b)): return a == b
        case (.developer(let a), .developer(let b)): return a == b
        case (.allReviews(let a), .allReviews(let b)): return a == b
        case (.forgotPassword, .forgotPassword): return true
        case (.forYou, .forYou): return true
        case (.globalError, .globalError): return true
        case (.noInternet, .noInternet): return true
        case (.forceUpdate, .forceUpdate): return true
        case (.rateLimit, .rateLimit): return true
        case (.installProgress(let a), .installProgress(let b)): return a == b
        case (.appStorage(let a), .appStorage(let b)): return a == b
        case (.versionHistory(let a), .versionHistory(let b)): return a == b
        case (.permissions(let a), .permissions(let b)): return a == b
        case (.accountOverview, .accountOverview): return true
        case (.devices, .devices): return true
        case (.security, .security): return true
        case (.deleteAccount, .deleteAccount): return true
        case (.notifications, .notifications): return true
        case (.notificationDetail(let a), .notificationDetail(let b)): return a == b
        case (.reviewDetail(let a), .reviewDetail(let b)): return a == b
        case (.reportReview, .reportReview): return true
        case (.reviewGuidelines, .reviewGuidelines): return true
        case (.helpSupport, .helpSupport): return true
        case (.aboutApp, .aboutApp): return true
        case (.legal(let a), .legal(let b)): return a == b
        case (.checkout(let a, _), .checkout(let b, _)): return a == b
        case (.paymentMethods, .paymentMethods): return true
        case (.addCard, .addCard): return true
        case (.connectWallet, .connectWallet): return true
        case (.verification, .verification): return true
        case (.paymentSuccess, .paymentSuccess): return true
        case (.paymentFailed, .paymentFailed): return true
        case (.wallet, .wallet): return true
        default: return false
        }
    }
}

class NavigationViewModel: ObservableObject {
    @Published var path = NavigationPath()
    @Published var presentedSheet: AppRoute? = nil
    
    // Store actions that cannot be passed via Hashable routes
    var pendingSystemAction: (() -> Void)?
    
    func navigate(to route: AppRoute) {
        if case .writeReview = route {
            presentedSheet = route
        } else {
            path.append(route)
        }
    }
    
    func showGlobalError(onRetry: @escaping () -> Void) {
        self.pendingSystemAction = onRetry
        self.navigate(to: .globalError)
    }
    
    func showNoInternet(onRetry: @escaping () -> Void) {
        self.pendingSystemAction = onRetry
        self.navigate(to: .noInternet)
    }
    
    func showRateLimit(onRetry: @escaping () -> Void) {
        self.pendingSystemAction = onRetry
        self.navigate(to: .rateLimit)
    }
    
    func goBack() {
        if !path.isEmpty {
            path.removeLast()
        }
    }
    
    func reset() {
        path = NavigationPath()
        presentedSheet = nil
        pendingSystemAction = nil
    }
}

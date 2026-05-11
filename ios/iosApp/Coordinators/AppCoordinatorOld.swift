import SwiftUI

struct AppCoordinatorOld: View {
    @StateObject private var navigation = NavigationViewModel()
    @AppStorage("isLoggedIn") var isLoggedIn: Bool = false
    @AppStorage("hasSeenOnboarding") var hasSeenOnboarding: Bool = false
    @Environment(\.appContainer) private var container

    var body: some View {
        Group {
            if !hasSeenOnboarding {
                // Assuming OnboardingView doesn't contain iOS 26+ specific views and can be reused
                // Otherwise use FallbackViewOld
                OnboardingView(isCompleted: $hasSeenOnboarding)
            } else {
                NavigationStack(path: $navigation.path) {
                    MainTabViewOld()
                        .navigationDestination(for: AppRoute.self) { route in
                            switch route {
                            case .login:
                                FallbackViewOld(title: "Login") // Replace later with LoginViewOld
                            case .home:
                                HomeViewOld()
                            case .profile(let userId):
                                ProfileViewOld()
                            case .detail(let itemId):
                                if itemId == "editor_choice" {
                                    EditorChoiceDetailViewOld()
                                } else {
                                    MiniAppDetailsViewOld()
                                }
                            case .miniApp(_, _):
                                FallbackViewOld(title: "Mini App Runtime")
                            case .activity:
                                ActivityViewOld()
                            case .editorChoice:
                                EditorChoiceDetailViewOld()
                            case .collection(_, let title):
                                FallbackViewOld(title: "Collection: \(title)")
                            case .updates:
                                FallbackViewOld(title: "Updates")
                            case .forYou:
                                ForYouViewOld()
                            case .settings:
                                FallbackViewOld(title: "Settings")
                            case .editProfile:
                                FallbackViewOld(title: "Edit Profile")
                            case .downloadHistory:
                                FallbackViewOld(title: "Download History")
                            case .writeReview:
                                EmptyView()  // Handled by sheet
                            case .developer(_):
                                FallbackViewOld(title: "Developer Profile")
                            case .allReviews(_):
                                FallbackViewOld(title: "All Reviews")
                            case .categoryDetail(_, let title):
                                FallbackViewOld(title: "Category: \(title)")
                            case .topCharts:
                                TopChartsViewOld()
                            case .myReviews:
                                FallbackViewOld(title: "My Reviews")
                            case .notificationPreferences:
                                FallbackViewOld(title: "Notification Preferences")
                            case .helpSupport:
                                FallbackViewOld(title: "Help & Support")
                            case .aboutApp:
                                FallbackViewOld(title: "About")
                            case .legal(let type):
                                FallbackViewOld(title: "Legal: \(type)")
                            // System & Lifecycle
                            case .globalError:
                                FallbackViewOld(title: "Global Error")
                            case .noInternet:
                                FallbackViewOld(title: "No Internet")
                            case .forceUpdate:
                                FallbackViewOld(title: "Force Update")
                            case .rateLimit:
                                FallbackViewOld(title: "Rate Limit")
                            case .installProgress(_):
                                FallbackViewOld(title: "Install Progress")
                            case .appStorage(_):
                                FallbackViewOld(title: "App Storage")
                            case .versionHistory(_):
                                FallbackViewOld(title: "Version History")
                            case .permissions(_):
                                FallbackViewOld(title: "Permissions")
                            // Account
                            case .accountOverview:
                                FallbackViewOld(title: "Account Overview")
                            case .devices:
                                FallbackViewOld(title: "Devices")
                            case .security:
                                FallbackViewOld(title: "Security")
                            case .deleteAccount:
                                FallbackViewOld(title: "Delete Account")
                            // Engagement
                            case .notifications:
                                FallbackViewOld(title: "Notifications")
                            case .notificationDetail(_):
                                FallbackViewOld(title: "Notification Detail")
                            case .reviewDetail(_):
                                FallbackViewOld(title: "Review Detail")
                            case .reportReview:
                                EmptyView()  // Handled by sheet
                            case .reviewGuidelines:
                                FallbackViewOld(title: "Review Guidelines")
                            case .forgotPassword:
                                FallbackViewOld(title: "Forgot Password")
                            case .checkout(_, _):
                                FallbackViewOld(title: "Checkout")
                            case .paymentMethods:
                                PaymentMethodsViewOld()
                            case .addCard:
                                AddCardViewOld()
                            case .connectWallet:
                                ConnectWalletViewOld()
                            case .verification:
                                VerificationViewOld()
                            case .paymentSuccess:
                                FallbackViewOld(title: "Payment Success")
                            case .paymentFailed:
                                FallbackViewOld(title: "Payment Failed")
                            case .wallet:
                                FallbackViewOld(title: "Wallet")
                            }
                        }
                }
                .sheet(item: $navigation.presentedSheet) { route in
                    switch route {
                    case .writeReview(_):
                        FallbackViewOld(title: "Write Review")
                    case .reportReview:
                        FallbackViewOld(title: "Report Review")
                    default:
                        EmptyView()
                    }
                }
            }
        }
        .environmentObject(navigation)
    }
}

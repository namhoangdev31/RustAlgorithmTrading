import SwiftUI

struct AppCoordinator: View {
    @StateObject private var navigation = NavigationViewModel()
    @AppStorage("isLoggedIn") var isLoggedIn: Bool = false
    @AppStorage("hasSeenOnboarding") var hasSeenOnboarding: Bool = false
    @Environment(\.appContainer) private var container

    var body: some View {
        Group {
            if !hasSeenOnboarding {
                OnboardingView(isCompleted: $hasSeenOnboarding)
            } else {
                rootContent
                    .sheet(item: $navigation.presentedSheet) { route in
                        switch route {
                        case .writeReview(let appId):
                            WriteReviewView(appId: appId)
                        case .reportReview:
                            ReportReviewSheet()
                        default:
                            EmptyView()
                        }
                    }
            }
        }
        .environmentObject(navigation)
        .onOpenURL { url in
            handleDeepLink(url)
        }
    }

    @ViewBuilder
    private var rootContent: some View {
        if #available(iOS 16.0, *) {
            NavigationStack(path: $navigation.path) {
                MainTabView()
                    .navigationDestination(for: AppRoute.self) { route in
                        destinationView(for: route)
                    }
            }
        } else {
            NavigationView {
                MainTabView()
            }
            .navigationViewStyle(StackNavigationViewStyle())
        }
    }

    @ViewBuilder
    private func destinationView(for route: AppRoute) -> some View {
        switch route {
        case .login:
            LoginView(viewModel: container.makeLoginViewModel())
        case .home:
            HomeView()
        case .profile(let userId):
            Text("Profile: \(userId)")
        case .detail(let itemId):
            if itemId == "editor_choice" {
                EditorChoiceDetailView()
            } else {
                MiniAppDetailsView()
            }
        case .miniApp(let manifest, let path):
            let vm = container.makeWebRuntimeViewModel()
            RuntimeView(manifest: manifest, bundlePath: URL(fileURLWithPath: path), viewModel: vm)
        case .activity:
            ActivityView()
        case .editorChoice:
            EditorChoiceDetailView()
        case .collection(let id, let title):
            CollectionDetailView(title: title, collectionId: id)
        case .updates:
            UpdatesView()
        case .forYou:
            ForYouView()
        case .settings:
            SettingsView()
        case .editProfile:
            EditProfileView()
        case .downloadHistory:
            DownloadHistoryView()
        case .writeReview:
            EmptyView()
        case .developer(let id):
            DeveloperProfileView(developerId: id)
        case .allReviews(let appId):
            AllReviewsView(appId: appId)
        case .categoryDetail(_, let title):
            CategoryDetailView(categoryTitle: title)
        case .topCharts:
            TopChartsView()
        case .myReviews:
            MyReviewsView()
        case .notificationPreferences:
            NotificationPreferencesView()
        case .helpSupport:
            HelpSupportView()
        case .aboutApp:
            AboutAppView()
        case .legal(let type):
            LegalView(type: type)
        case .globalError:
            GlobalErrorView(onRetry: { navigation.pendingSystemAction?(); navigation.goBack() })
        case .noInternet:
            NoInternetView(onRetry: { navigation.pendingSystemAction?(); navigation.goBack() })
        case .forceUpdate:
            ForceUpdateView(onUpdate: {
                if let url = URL(string: "https://apps.apple.com") {
                    UIApplication.shared.open(url)
                }
            })
        case .rateLimit:
            RateLimitView(onRetry: { navigation.pendingSystemAction?(); navigation.goBack() })
        case .installProgress(let id):
            InstallProgressView(appId: id)
        case .appStorage(let id):
            AppStorageView(appId: id)
        case .versionHistory(let id):
            VersionHistoryView(appId: id)
        case .permissions(let id):
            PermissionsView(appId: id)
        case .accountOverview:
            AccountOverviewView()
        case .devices:
            DeviceManagementView()
        case .security:
            SecuritySettingsView()
        case .deleteAccount:
            DeleteAccountView()
        case .notifications:
            NotificationInboxView()
        case .notificationDetail(let id):
            NotificationDetailView(notification: .init(title: "Notification", message: "Details for \(id)", time: "Now", isRead: true, type: "system"))
        case .reviewDetail(let id):
            ReviewDetailView(reviewId: id)
        case .reportReview:
            EmptyView()
        case .reviewGuidelines:
            ReviewGuidelinesView()
        case .forgotPassword:
            ForgotPasswordView()
        case .checkout(let appId, let price):
            CheckoutView(appId: appId, price: price)
        case .paymentMethods:
            PaymentMethodsView()
        case .addCard:
            AddCardView()
        case .connectWallet:
            ConnectWalletView()
        case .verification:
            VerificationView()
        case .paymentSuccess:
            PaymentResultView(type: .success)
        case .paymentFailed:
            PaymentResultView(type: .failure)
        case .wallet:
            WalletView()
        }
    }

    private func handleDeepLink(_ url: URL) {
        guard url.scheme == "lepos", url.host == "app" else { return }
        let pathComponents = url.pathComponents.filter { $0 != "/" }
        if pathComponents.count >= 2 {
            let type = pathComponents[0]
            let id = pathComponents[1]
            if type == "detail" {
                navigation.navigate(to: .detail(itemId: id))
            } else if type == "developer" {
                navigation.navigate(to: .developer(id: id))
            }
        }
    }
}

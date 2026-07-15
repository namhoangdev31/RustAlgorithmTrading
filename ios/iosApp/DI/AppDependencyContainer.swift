import Foundation
import SwiftUI

// MARK: - App Dependency Container
// Responsible for initializing the dependency graph and creating ViewModels.
// This is the Composition Root for iOS.
// Now uses native Swift SharedComponent instead of KMP Shared framework.

final class AppDependencyContainer: ObservableObject {
    
    private let sharedComponent: SharedComponent
    
    init() {
        let bundleDownloader = iOSBundleDownloader(baseUrl: AppConfig.apiBaseUrl)
        self.sharedComponent = SharedComponent(baseUrl: AppConfig.apiBaseUrl, bundleDownloader: bundleDownloader)
    }
    
    // MARK: - ViewModel Factory Methods
    // Views call these methods to get their initialized ViewModels.
    
    @MainActor
    func makeLoginViewModel() -> LoginViewModel {
        return LoginViewModel(loginUseCase: sharedComponent.loginUseCase)
    }
    
    @MainActor
    func makeHomeViewModel() -> HomeViewModel {
        return HomeViewModel(
            getFeaturedAppUseCase: sharedComponent.getFeaturedAppUseCase,
            getAppsWeLoveUseCase: sharedComponent.getAppsWeLoveUseCase,
            getTopCollectionsUseCase: sharedComponent.getTopCollectionsUseCase,
            getPersonalizedAppsUseCase: sharedComponent.getPersonalizedAppsUseCase
        )
    }
    
    @MainActor
    func makeMiniAppStoreViewModel() -> MiniAppStoreViewModel {
        return MiniAppStoreViewModel(
            getBundlesUseCase: sharedComponent.getBundlesUseCase,
            downloadBundleUseCase: sharedComponent.downloadBundleUseCase
        )
    }
    
    static weak var activeWebRuntimeViewModel: WebRuntimeViewModel?
    
    @MainActor
    func makeWebRuntimeViewModel() -> WebRuntimeViewModel {
        let vm = WebRuntimeViewModel()
        Self.activeWebRuntimeViewModel = vm
        return vm
    }
    
    static var cachedBrowserViewModel: BrowserViewModel?

    @MainActor private static var cachedQuantAntStore: QuantAntStore?

    @MainActor
    func makeQuantAntStore() -> QuantAntStore {
        if let cached = Self.cachedQuantAntStore { return cached }
        let client = QuantAntAPIClient(
            baseURL: AppConfig.quantAntBaseURL,
            tokenStorage: sharedComponent.authTokenStorage
        )
        let cache = QuantAntCache(container: QuantAntCache.makeContainer())
        let webSocket = QuantAntWebSocketClient(
            url: AppConfig.quantAntWebSocketURL,
            tokenStorage: sharedComponent.authTokenStorage
        )
        let store = QuantAntStore(client: client, cache: cache, webSocket: webSocket)
        Self.cachedQuantAntStore = store
        return store
    }
    
    @MainActor
    func makeBrowserViewModel(initialURL: String?, privateMode: Bool) -> BrowserViewModel {
        let vm: BrowserViewModel
        if let cached = Self.cachedBrowserViewModel {
            vm = cached
        } else {
            vm = BrowserViewModel(initialURL: nil, isPrivate: privateMode)
            Self.cachedBrowserViewModel = vm
        }
        vm.handleExternalNavigation(initialURL: initialURL, isPrivate: privateMode)
        return vm
    }
}

// MARK: - Environment Key
// Key to store the AppDependencyContainer in the Environment

private struct AppContainerKey: EnvironmentKey {
    static let defaultValue = AppDependencyContainer()
}

extension EnvironmentValues {
    var appContainer: AppDependencyContainer {
        get { self[AppContainerKey.self] }
        set { self[AppContainerKey.self] = newValue }
    }
}

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
    
    @MainActor
    func makeWebRuntimeViewModel() -> WebRuntimeViewModel {
        return WebRuntimeViewModel()
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

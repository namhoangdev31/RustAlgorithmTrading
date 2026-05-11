import Foundation

/// Native Swift SharedComponent replacing the Kotlin KMP SharedComponent.
/// This is the composition root for all shared business logic.
class SharedComponent {
    private let baseUrl: String
    private let bundleDownloaderInstance: BundleDownloader
    
    // Services
    private let apiService: ApiService
    private let tokenStorage: TokenStorage
    
    // Repositories (lazy singletons)
    private lazy var userRepo: UserRepository = MockUserRepository(apiService: apiService)
    private lazy var bundleRepo: BundleRepository = MockBundleRepository(apiService: apiService)
    private lazy var todayRepo: TodayRepository = MockTodayRepository(apiService: apiService)
    private lazy var loginRepo: LoginRepository = MockLoginRepository(apiService: apiService, tokenStorage: tokenStorage)
    
    init(baseUrl: String, bundleDownloader: BundleDownloader) {
        self.baseUrl = baseUrl
        self.bundleDownloaderInstance = bundleDownloader
        self.apiService = ApiService(baseUrl: baseUrl)
        self.tokenStorage = TokenStorage()
    }
    
    // MARK: - UseCases
    
    var loginUseCase: LoginUseCase {
        LoginUseCase(repository: loginRepo)
    }
    
    var homeUseCase: HomeUseCase {
        HomeUseCase()
    }
    
    var getUsersUseCase: GetUsersUseCase {
        GetUsersUseCase(repository: userRepo)
    }
    
    var getBundlesUseCase: GetBundlesUseCase {
        GetBundlesUseCase(repository: bundleRepo)
    }
    
    var downloadBundleUseCase: DownloadBundleUseCase {
        DownloadBundleUseCase(repository: bundleRepo, downloader: bundleDownloaderInstance)
    }
    
    var getFeaturedAppUseCase: GetFeaturedAppUseCase {
        GetFeaturedAppUseCase(repository: todayRepo)
    }
    
    var getAppsWeLoveUseCase: GetAppsWeLoveUseCase {
        GetAppsWeLoveUseCase(repository: todayRepo)
    }
    
    var getTopCollectionsUseCase: GetTopCollectionsUseCase {
        GetTopCollectionsUseCase(repository: todayRepo)
    }
    
    var getPersonalizedAppsUseCase: GetPersonalizedAppsUseCase {
        GetPersonalizedAppsUseCase(repository: todayRepo)
    }
}

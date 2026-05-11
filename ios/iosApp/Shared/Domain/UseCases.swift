import Foundation

// MARK: - Use Cases (replacing KMP Shared UseCases)

class LoginUseCase {
    private let repository: LoginRepository
    
    init(repository: LoginRepository) {
        self.repository = repository
    }
    
    func login(email: String, password: String) async -> DomainResult<Bool> {
        return await repository.login(email: email, password: password)
    }
}

class HomeUseCase {
    // Placeholder — maps to KMP HomeUseCase
    func execute() async {}
}

class GetUsersUseCase {
    private let repository: UserRepository
    
    init(repository: UserRepository) {
        self.repository = repository
    }
    
    func execute() async -> AppResult<[User]> {
        return await repository.getUsers()
    }
}

class GetBundlesUseCase {
    private let repository: BundleRepository
    
    init(repository: BundleRepository) {
        self.repository = repository
    }
    
    func execute() async -> AppResult<[Bundle_]> {
        return await repository.getBundles()
    }
}

class DownloadBundleUseCase {
    private let repository: BundleRepository
    private let downloader: BundleDownloader
    
    init(repository: BundleRepository, downloader: BundleDownloader) {
        self.repository = repository
        self.downloader = downloader
    }
    
    func execute(bundleId: String) async -> AppResult<String> {
        let urlResult = await repository.getDownloadUrl(bundleId: bundleId)
        switch urlResult {
        case .success(let url):
            return await downloader.download(url: url, bundleId: bundleId)
        case .error(let error):
            return .error(error)
        }
    }
}

class GetBundleStatsUseCase {
    private let repository: BundleRepository
    
    init(repository: BundleRepository) {
        self.repository = repository
    }
    
    func execute(bundleId: String) async -> AppResult<BundleStats?> {
        return await repository.getBundleStats(bundleId: bundleId)
    }
}

class GetBundlePromotionsUseCase {
    private let repository: BundleRepository
    
    init(repository: BundleRepository) {
        self.repository = repository
    }
    
    func execute(bundleId: String) async -> AppResult<[BundlePromotion]> {
        return await repository.getBundlePromotions(bundleId: bundleId)
    }
}

class TrackBundleDownloadUseCase {
    private let repository: BundleRepository
    
    init(repository: BundleRepository) {
        self.repository = repository
    }
    
    func execute(bundleId: String) async -> AppResult<Void> {
        return await repository.trackDownload(bundleId: bundleId)
    }
}

// MARK: - Today Use Cases

class GetFeaturedAppUseCase {
    private let repository: TodayRepository
    
    init(repository: TodayRepository) {
        self.repository = repository
    }
    
    func execute() async -> DomainResult<FeaturedApp> {
        return await repository.getFeaturedApp()
    }
}

class GetAppsWeLoveUseCase {
    private let repository: TodayRepository
    
    init(repository: TodayRepository) {
        self.repository = repository
    }
    
    func execute() async -> DomainResult<[MiniApp]> {
        return await repository.getAppsWeLove()
    }
}

class GetTopCollectionsUseCase {
    private let repository: TodayRepository
    
    init(repository: TodayRepository) {
        self.repository = repository
    }
    
    func execute() async -> DomainResult<[AppCollection]> {
        return await repository.getTopCollections()
    }
}

class GetPersonalizedAppsUseCase {
    private let repository: TodayRepository
    
    init(repository: TodayRepository) {
        self.repository = repository
    }
    
    func execute() async -> DomainResult<[MiniApp]> {
        return await repository.getPersonalizedApps()
    }
}

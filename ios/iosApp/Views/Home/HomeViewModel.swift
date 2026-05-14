import Foundation

@MainActor
class HomeViewModel: ObservableObject {
    @Published var featuredApp: FeaturedApp? = nil
    @Published var appsWeLove: [MiniApp] = []
    @Published var topCollections: [AppCollection] = []
    @Published var personalizedApps: [MiniApp] = []

    @Published var isLoading: Bool = false
    @Published var error: String? = nil

    private let getFeaturedAppUseCase: GetFeaturedAppUseCase
    private let getAppsWeLoveUseCase: GetAppsWeLoveUseCase
    private let getTopCollectionsUseCase: GetTopCollectionsUseCase
    private let getPersonalizedAppsUseCase: GetPersonalizedAppsUseCase

    init(
        getFeaturedAppUseCase: GetFeaturedAppUseCase,
        getAppsWeLoveUseCase: GetAppsWeLoveUseCase,
        getTopCollectionsUseCase: GetTopCollectionsUseCase,
        getPersonalizedAppsUseCase: GetPersonalizedAppsUseCase
    ) {
        self.getFeaturedAppUseCase = getFeaturedAppUseCase
        self.getAppsWeLoveUseCase = getAppsWeLoveUseCase
        self.getTopCollectionsUseCase = getTopCollectionsUseCase
        self.getPersonalizedAppsUseCase = getPersonalizedAppsUseCase
    }

    func load() async {
        isLoading = true
        error = nil

        async let featured = getFeaturedAppUseCase.execute()
        async let loved = getAppsWeLoveUseCase.execute()
        async let collections = getTopCollectionsUseCase.execute()
        async let personalized = getPersonalizedAppsUseCase.execute()

        let featuredResult = await featured
        let lovedResult = await loved
        let collectionsResult = await collections
        let personalizedResult = await personalized

        if featuredResult.isSuccess, let value = featuredResult.data {
            featuredApp = value
        } else {
            error = message(from: featuredResult.error)
        }

        if lovedResult.isSuccess, let value = lovedResult.data {
            appsWeLove = value
        } else {
            error = error ?? message(from: lovedResult.error)
        }

        if collectionsResult.isSuccess, let value = collectionsResult.data {
            topCollections = value
        } else {
            error = error ?? message(from: collectionsResult.error)
        }

        if personalizedResult.isSuccess, let value = personalizedResult.data {
            personalizedApps = value
        } else {
            error = error ?? message(from: personalizedResult.error)
        }

        isLoading = false
    }

    private func message(from error: AppError?) -> String {
        guard let error else { return "Unknown error" }
        switch error {
        case .networkError(let message, _): return message ?? "Network error"
        case .serverError(_, let message): return message ?? "Server error"
        case .databaseError(let message, _): return message ?? "Database error"
        case .unknownError(let message, _): return message ?? "Unknown error"
        case .validationError(let message): return message ?? "Validation error"
        }
    }
}

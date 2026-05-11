import Foundation
// import Shared — replaced by native Swift Shared module

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
        
        do {
            // Fetch all data in parallel
            async let featured = getFeaturedAppUseCase.invoke()
            async let loved = getAppsWeLoveUseCase.invoke()
            async let collections = getTopCollectionsUseCase.invoke()
            async let personalized = getPersonalizedAppsUseCase.invoke()
            
            // Await and process results
            if let featuredResult = try await featured as? DomainResultSuccess {
                self.featuredApp = featuredResult.data as? FeaturedApp
            }
            
            if let lovedResult = try await loved as? DomainResultSuccess {
                self.appsWeLove = lovedResult.data as? [MiniApp] ?? []
            }
            
            if let collectionsResult = try await collections as? DomainResultSuccess {
                self.topCollections = collectionsResult.data as? [AppCollection] ?? []
            }
            
            if let personalizedResult = try await personalized as? DomainResultSuccess {
                self.personalizedApps = personalizedResult.data as? [MiniApp] ?? []
            }
            
        } catch {
            self.error = error.localizedDescription
            print("HomeViewModel Error: \(error)")
        }
        
        isLoading = false
    }
}

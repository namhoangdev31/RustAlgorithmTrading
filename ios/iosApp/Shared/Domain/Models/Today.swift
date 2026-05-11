import Foundation

struct MiniApp: Identifiable, Codable {
    let id: String
    let name: String
    let iconUrl: String
    let category: String
    let rating: Double
    let developer: String
    let price: String?
    
    init(
        id: String,
        name: String,
        iconUrl: String,
        category: String,
        rating: Double,
        developer: String,
        price: String? = nil
    ) {
        self.id = id
        self.name = name
        self.iconUrl = iconUrl
        self.category = category
        self.rating = rating
        self.developer = developer
        self.price = price
    }
}

struct FeaturedApp: Identifiable, Codable {
    let id: String
    let processedId: String
    let badge: String
    let title: String
    let subtitle: String
    let backgroundImageUrl: String
    let app: MiniApp?
    
    init(
        id: String,
        processedId: String,
        badge: String,
        title: String,
        subtitle: String,
        backgroundImageUrl: String,
        app: MiniApp? = nil
    ) {
        self.id = id
        self.processedId = processedId
        self.badge = badge
        self.title = title
        self.subtitle = subtitle
        self.backgroundImageUrl = backgroundImageUrl
        self.app = app
    }
}

struct AppCollection: Identifiable, Codable {
    let id: String
    let name: String
    let subtitle: String
    let coverImageUrl: String
    let apps: [MiniApp]
}

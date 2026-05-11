import Foundation

/// Replaces KMP Bundle_
struct Bundle_: Identifiable, Codable {
    let id: String
    let bundleKey: String?
    let name: String
    let slug: String?
    let version: String
    let buildNumber: Int
    
    // Display
    let iconUrl: String?
    let bannerUrl: String?
    let shortDescription: String?
    let description: String?
    let privacyPolicyUrl: String?
    let supportUrl: String?
    let websiteUrl: String?
    
    // Developer
    let developerName: String?
    let developerId: String?
    let developerEmail: String?
    
    // Categorization
    let category: String?
    let subCategory: String?
    
    // Storage
    let storagePath: String
    let bucket: String
    let fileSize: Int64?
    let checksum: String?
    
    // Pricing
    let price: Double?
    let currency: String?
    let isFree: Bool
    let isOneTimePayment: Bool
    let hasInAppPurchases: Bool
    let hasSubscription: Bool
    
    // Publishing
    let status: String
    let rejectionReason: String?
    let publishedAt: Date?
    let expiresAt: Date?
    let changelog: String?
    let releaseNotes: String?
    let minOsVersion: String?
    let runtimeType: String
    
    // Ratings
    let rating: Double?
    let ratingCount: Int
    let rating1: Int
    let rating2: Int
    let rating3: Int
    let rating4: Int
    let rating5: Int
    
    // Store metadata
    let ageRating: String?
    let contentAdvisory: String?
    let downloadCount: Int64
    let activeInstalls: Int64
    let isFeatured: Bool
    let isVerified: Bool
    let isEditorChoice: Bool
    let featuredOrder: Int?
    
    // Timestamps
    let createdAt: Date
    let updatedAt: Date
    let deletedAt: Date?
    
    // Child entities
    let screenshots: [BundleScreenshot]
    let tags: [BundleTag]
    let languages: [BundleLanguage]
    let inAppPurchases: [BundleInAppPurchase]
    
    init(
        id: String,
        bundleKey: String? = nil,
        name: String,
        slug: String? = nil,
        version: String,
        buildNumber: Int = 1,
        iconUrl: String? = nil,
        bannerUrl: String? = nil,
        shortDescription: String? = nil,
        description: String? = nil,
        privacyPolicyUrl: String? = nil,
        supportUrl: String? = nil,
        websiteUrl: String? = nil,
        developerName: String? = nil,
        developerId: String? = nil,
        developerEmail: String? = nil,
        category: String? = nil,
        subCategory: String? = nil,
        storagePath: String,
        bucket: String,
        fileSize: Int64? = nil,
        checksum: String? = nil,
        price: Double? = nil,
        currency: String? = nil,
        isFree: Bool = true,
        isOneTimePayment: Bool = false,
        hasInAppPurchases: Bool = false,
        hasSubscription: Bool = false,
        status: String = "draft",
        rejectionReason: String? = nil,
        publishedAt: Date? = nil,
        expiresAt: Date? = nil,
        changelog: String? = nil,
        releaseNotes: String? = nil,
        minOsVersion: String? = nil,
        runtimeType: String = "standard",
        rating: Double? = nil,
        ratingCount: Int = 0,
        rating1: Int = 0,
        rating2: Int = 0,
        rating3: Int = 0,
        rating4: Int = 0,
        rating5: Int = 0,
        ageRating: String? = nil,
        contentAdvisory: String? = nil,
        downloadCount: Int64 = 0,
        activeInstalls: Int64 = 0,
        isFeatured: Bool = false,
        isVerified: Bool = false,
        isEditorChoice: Bool = false,
        featuredOrder: Int? = nil,
        createdAt: Date = Date(),
        updatedAt: Date = Date(),
        deletedAt: Date? = nil,
        screenshots: [BundleScreenshot] = [],
        tags: [BundleTag] = [],
        languages: [BundleLanguage] = [],
        inAppPurchases: [BundleInAppPurchase] = []
    ) {
        self.id = id
        self.bundleKey = bundleKey
        self.name = name
        self.slug = slug
        self.version = version
        self.buildNumber = buildNumber
        self.iconUrl = iconUrl
        self.bannerUrl = bannerUrl
        self.shortDescription = shortDescription
        self.description = description
        self.privacyPolicyUrl = privacyPolicyUrl
        self.supportUrl = supportUrl
        self.websiteUrl = websiteUrl
        self.developerName = developerName
        self.developerId = developerId
        self.developerEmail = developerEmail
        self.category = category
        self.subCategory = subCategory
        self.storagePath = storagePath
        self.bucket = bucket
        self.fileSize = fileSize
        self.checksum = checksum
        self.price = price
        self.currency = currency
        self.isFree = isFree
        self.isOneTimePayment = isOneTimePayment
        self.hasInAppPurchases = hasInAppPurchases
        self.hasSubscription = hasSubscription
        self.status = status
        self.rejectionReason = rejectionReason
        self.publishedAt = publishedAt
        self.expiresAt = expiresAt
        self.changelog = changelog
        self.releaseNotes = releaseNotes
        self.minOsVersion = minOsVersion
        self.runtimeType = runtimeType
        self.rating = rating
        self.ratingCount = ratingCount
        self.rating1 = rating1
        self.rating2 = rating2
        self.rating3 = rating3
        self.rating4 = rating4
        self.rating5 = rating5
        self.ageRating = ageRating
        self.contentAdvisory = contentAdvisory
        self.downloadCount = downloadCount
        self.activeInstalls = activeInstalls
        self.isFeatured = isFeatured
        self.isVerified = isVerified
        self.isEditorChoice = isEditorChoice
        self.featuredOrder = featuredOrder
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.deletedAt = deletedAt
        self.screenshots = screenshots
        self.tags = tags
        self.languages = languages
        self.inAppPurchases = inAppPurchases
    }
}

struct BundleScreenshot: Codable, Identifiable {
    let id: String
    let bundleId: String
    let imageUrl: String
    let caption: String?
    let orderIndex: Int
    let deviceType: String?
}

struct BundleTag: Codable, Identifiable {
    let id: String
    let name: String
    let slug: String?
}

struct BundleLanguage: Codable, Identifiable {
    let id: String
    let bundleId: String
    let languageCode: String
    let isDefault: Bool
}

struct BundleInAppPurchase: Codable, Identifiable {
    let id: String
    let bundleId: String
    let productId: String
    let name: String
    let description: String?
    let price: Double
    let currency: String
    let purchaseType: String
}

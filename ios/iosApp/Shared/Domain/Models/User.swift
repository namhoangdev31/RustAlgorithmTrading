import Foundation

struct User: Identifiable, Codable {
    let id: String
    let email: String?
    let phone: String?
    let socialId: String?
    let firstName: String?
    let lastName: String?
    let fullName: String?
    let photoUrl: String?
    let userType: String?
    let createdAt: Date
    let updatedAt: Date
    
    init(
        id: String,
        email: String? = nil,
        phone: String? = nil,
        socialId: String? = nil,
        firstName: String? = nil,
        lastName: String? = nil,
        fullName: String? = nil,
        photoUrl: String? = nil,
        userType: String? = "individual",
        createdAt: Date = Date(),
        updatedAt: Date = Date()
    ) {
        self.id = id
        self.email = email
        self.phone = phone
        self.socialId = socialId
        self.firstName = firstName
        self.lastName = lastName
        self.fullName = fullName
        self.photoUrl = photoUrl
        self.userType = userType
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}

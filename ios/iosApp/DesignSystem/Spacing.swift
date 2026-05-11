import SwiftUI
// import Shared — replaced by native Swift Shared module

struct DesignSystem {
    struct Spacing {
        static let xs = CGFloat(DesignTokens.Spacing().xs)
        static let sm = CGFloat(DesignTokens.Spacing().sm)
        static let md = CGFloat(DesignTokens.Spacing().md)
        static let lg = CGFloat(DesignTokens.Spacing().lg)
        static let xl = CGFloat(DesignTokens.Spacing().xl)
        static let xxl = CGFloat(DesignTokens.Spacing().xxl)
    }
    
    // Typography logic could be added here if customized Font extensions are needed
    // For now, SwiftUI dynamic type is often preferred, but we can map specific sizes if required.
}

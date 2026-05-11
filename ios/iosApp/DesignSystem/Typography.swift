import SwiftUI
// import Shared — replaced by native Swift Shared module

extension Font {
    // Helper to allow fallback if custom font is missing
    private static func roboto(size: Int32, weight: Font.Weight = .regular) -> Font {
        let sizeCGFloat = CGFloat(size)
        let fontName: String
        
        switch weight {
        case .black: fontName = "Roboto-Black"
        case .heavy: fontName = "Roboto-ExtraBold"
        case .bold: fontName = "Roboto-Bold"
        case .semibold: fontName = "Roboto-SemiBold"
        case .medium: fontName = "Roboto-Medium"
        case .regular: fontName = "Roboto-Regular"
        case .light: fontName = "Roboto-Light"
        case .thin: fontName = "Roboto-Thin"
        case .ultraLight: fontName = "Roboto-ExtraLight"
        default: fontName = "Roboto-Regular"
        }
        
        return Font.custom(fontName, size: sizeCGFloat)
    }
    
    static let leposDisplayLarge = roboto(size: DesignTokens.Typography().displayLarge, weight: .regular)
    static let leposDisplayMedium = roboto(size: DesignTokens.Typography().displayMedium, weight: .regular)
    static let leposDisplaySmall = roboto(size: DesignTokens.Typography().displaySmall, weight: .regular)
    
    static let leposHeadlineLarge = roboto(size: DesignTokens.Typography().headlineLarge, weight: .regular)
    static let leposHeadlineMedium = roboto(size: DesignTokens.Typography().headlineMedium, weight: .regular)
    static let leposHeadlineSmall = roboto(size: DesignTokens.Typography().headlineSmall, weight: .regular)
    
    static let leposTitleLarge = roboto(size: DesignTokens.Typography().titleLarge, weight: .medium)
    static let leposTitleMedium = roboto(size: DesignTokens.Typography().titleMedium, weight: .medium)
    static let leposTitleSmall = roboto(size: DesignTokens.Typography().titleSmall, weight: .medium)
    
    static let leposBodyLarge = roboto(size: DesignTokens.Typography().bodyLarge, weight: .regular)
    static let leposBodyMedium = roboto(size: DesignTokens.Typography().bodyMedium, weight: .regular)
    static let leposBodySmall = roboto(size: DesignTokens.Typography().bodySmall, weight: .regular)
    
    static let leposLabelLarge = roboto(size: DesignTokens.Typography().labelLarge, weight: .medium)
    static let leposLabelMedium = roboto(size: DesignTokens.Typography().labelMedium, weight: .medium)
    static let leposLabelSmall = roboto(size: DesignTokens.Typography().labelSmall, weight: .medium)
}

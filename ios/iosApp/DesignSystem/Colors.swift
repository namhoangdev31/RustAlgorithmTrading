import SwiftUI
// import Shared — replaced by native Swift Shared module
import UIKit

extension Color {
    // Brand Colors (Dynamic)
    static let leposPrimary = Color(dynamicProvider: { trait in
        trait.userInterfaceStyle == .dark ? Int64(DesignTokens.DarkColors().Primary) : Int64(DesignTokens.LightColors().Primary)
    })
    static let leposOnPrimary = Color(dynamicProvider: { trait in
        trait.userInterfaceStyle == .dark ? Int64(DesignTokens.DarkColors().OnPrimary) : Int64(DesignTokens.LightColors().OnPrimary)
    })
    static let leposPrimaryContainer = Color(dynamicProvider: { trait in
        trait.userInterfaceStyle == .dark ? Int64(DesignTokens.DarkColors().PrimaryContainer) : Int64(DesignTokens.LightColors().PrimaryContainer)
    })
    static let leposOnPrimaryContainer = Color(dynamicProvider: { trait in
        trait.userInterfaceStyle == .dark ? Int64(DesignTokens.DarkColors().OnPrimaryContainer) : Int64(DesignTokens.LightColors().OnPrimaryContainer)
    })
    
    static let leposSecondary = Color(dynamicProvider: { trait in
        trait.userInterfaceStyle == .dark ? Int64(DesignTokens.DarkColors().Secondary) : Int64(DesignTokens.LightColors().Secondary)
    })
    static let leposOnSecondary = Color(dynamicProvider: { trait in
        trait.userInterfaceStyle == .dark ? Int64(DesignTokens.DarkColors().OnSecondary) : Int64(DesignTokens.LightColors().OnSecondary)
    })
    static let leposSecondaryContainer = Color(dynamicProvider: { trait in
        trait.userInterfaceStyle == .dark ? Int64(DesignTokens.DarkColors().SecondaryContainer) : Int64(DesignTokens.LightColors().SecondaryContainer)
    })
    static let leposOnSecondaryContainer = Color(dynamicProvider: { trait in
        trait.userInterfaceStyle == .dark ? Int64(DesignTokens.DarkColors().OnSecondaryContainer) : Int64(DesignTokens.LightColors().OnSecondaryContainer)
    })
    
    static let leposTertiary = Color(dynamicProvider: { trait in
        trait.userInterfaceStyle == .dark ? Int64(DesignTokens.DarkColors().Tertiary) : Int64(DesignTokens.LightColors().Tertiary)
    })
    static let leposOnTertiary = Color(dynamicProvider: { trait in
        trait.userInterfaceStyle == .dark ? Int64(DesignTokens.DarkColors().OnTertiary) : Int64(DesignTokens.LightColors().OnTertiary)
    })
    static let leposTertiaryContainer = Color(dynamicProvider: { trait in
        trait.userInterfaceStyle == .dark ? Int64(DesignTokens.DarkColors().TertiaryContainer) : Int64(DesignTokens.LightColors().TertiaryContainer)
    })
    static let leposOnTertiaryContainer = Color(dynamicProvider: { trait in
        trait.userInterfaceStyle == .dark ? Int64(DesignTokens.DarkColors().OnTertiaryContainer) : Int64(DesignTokens.LightColors().OnTertiaryContainer)
    })
    
    // Semantic Colors (Dynamic)
    static let leposBackground = Color(dynamicProvider: { trait in
        trait.userInterfaceStyle == .dark ? Int64(DesignTokens.DarkColors().Background) : Int64(DesignTokens.LightColors().Background)
    })
    static let leposOnBackground = Color(dynamicProvider: { trait in
        trait.userInterfaceStyle == .dark ? Int64(DesignTokens.DarkColors().OnBackground) : Int64(DesignTokens.LightColors().OnBackground)
    })
    
    static let leposSurface = Color(dynamicProvider: { trait in
        trait.userInterfaceStyle == .dark ? Int64(DesignTokens.DarkColors().Surface) : Int64(DesignTokens.LightColors().Surface)
    })
    static let leposOnSurface = Color(dynamicProvider: { trait in
        trait.userInterfaceStyle == .dark ? Int64(DesignTokens.DarkColors().OnSurface) : Int64(DesignTokens.LightColors().OnSurface)
    })
    
    static let leposSurfaceVariant = Color(dynamicProvider: { trait in
        trait.userInterfaceStyle == .dark ? Int64(DesignTokens.DarkColors().SurfaceVariant) : Int64(DesignTokens.LightColors().SurfaceVariant)
    })
    static let leposOnSurfaceVariant = Color(dynamicProvider: { trait in
        trait.userInterfaceStyle == .dark ? Int64(DesignTokens.DarkColors().OnSurfaceVariant) : Int64(DesignTokens.LightColors().OnSurfaceVariant)
    })
    
    static let leposError = Color(dynamicProvider: { trait in
        trait.userInterfaceStyle == .dark ? Int64(DesignTokens.DarkColors().Error) : Int64(DesignTokens.LightColors().Error)
    })
    static let leposOnError = Color(dynamicProvider: { trait in
        trait.userInterfaceStyle == .dark ? Int64(DesignTokens.DarkColors().OnError) : Int64(DesignTokens.LightColors().OnError)
    })
    static let leposErrorContainer = Color(dynamicProvider: { trait in
        trait.userInterfaceStyle == .dark ? Int64(DesignTokens.DarkColors().ErrorContainer) : Int64(DesignTokens.LightColors().ErrorContainer)
    })
    static let leposOnErrorContainer = Color(dynamicProvider: { trait in
        trait.userInterfaceStyle == .dark ? Int64(DesignTokens.DarkColors().OnErrorContainer) : Int64(DesignTokens.LightColors().OnErrorContainer)
    })
    
    static let leposOutline = Color(dynamicProvider: { trait in
        trait.userInterfaceStyle == .dark ? Int64(DesignTokens.DarkColors().Outline) : Int64(DesignTokens.LightColors().Outline)
    })
    static let leposOutlineVariant = Color(dynamicProvider: { trait in
        trait.userInterfaceStyle == .dark ? Int64(DesignTokens.DarkColors().OutlineVariant) : Int64(DesignTokens.LightColors().OutlineVariant)
    })
    
    static let leposInversePrimary = Color(dynamicProvider: { trait in
        trait.userInterfaceStyle == .dark ? Int64(DesignTokens.DarkColors().InversePrimary) : Int64(DesignTokens.LightColors().InversePrimary)
    })
    static let leposInverseSurface = Color(dynamicProvider: { trait in
        trait.userInterfaceStyle == .dark ? Int64(DesignTokens.DarkColors().InverseSurface) : Int64(DesignTokens.LightColors().InverseSurface)
    })
    static let leposInverseOnSurface = Color(dynamicProvider: { trait in
        trait.userInterfaceStyle == .dark ? Int64(DesignTokens.DarkColors().InverseOnSurface) : Int64(DesignTokens.LightColors().InverseOnSurface)
    })
    static let leposSurfaceTint = Color(dynamicProvider: { trait in
        trait.userInterfaceStyle == .dark ? Int64(DesignTokens.DarkColors().SurfaceTint) : Int64(DesignTokens.LightColors().SurfaceTint)
    })
    
    static let leposScrim = Color(dynamicProvider: { trait in
        trait.userInterfaceStyle == .dark ? Int64(DesignTokens.DarkColors().Scrim) : Int64(DesignTokens.LightColors().Scrim)
    })
    
    static let leposSurfaceBright = Color(dynamicProvider: { trait in
        trait.userInterfaceStyle == .dark ? Int64(DesignTokens.DarkColors().SurfaceBright) : Int64(DesignTokens.LightColors().SurfaceBright)
    })
    static let leposSurfaceDim = Color(dynamicProvider: { trait in
        trait.userInterfaceStyle == .dark ? Int64(DesignTokens.DarkColors().SurfaceDim) : Int64(DesignTokens.LightColors().SurfaceDim)
    })
    static let leposSurfaceContainer = Color(dynamicProvider: { trait in
        trait.userInterfaceStyle == .dark ? Int64(DesignTokens.DarkColors().SurfaceContainer) : Int64(DesignTokens.LightColors().SurfaceContainer)
    })
    static let leposSurfaceContainerHigh = Color(dynamicProvider: { trait in
        trait.userInterfaceStyle == .dark ? Int64(DesignTokens.DarkColors().SurfaceContainerHigh) : Int64(DesignTokens.LightColors().SurfaceContainerHigh)
    })
    static let leposSurfaceContainerHighest = Color(dynamicProvider: { trait in
        trait.userInterfaceStyle == .dark ? Int64(DesignTokens.DarkColors().SurfaceContainerHighest) : Int64(DesignTokens.LightColors().SurfaceContainerHighest)
    })
    static let leposSurfaceContainerLow = Color(dynamicProvider: { trait in
        trait.userInterfaceStyle == .dark ? Int64(DesignTokens.DarkColors().SurfaceContainerLow) : Int64(DesignTokens.LightColors().SurfaceContainerLow)
    })
    static let leposSurfaceContainerLowest = Color(dynamicProvider: { trait in
        trait.userInterfaceStyle == .dark ? Int64(DesignTokens.DarkColors().SurfaceContainerLowest) : Int64(DesignTokens.LightColors().SurfaceContainerLowest)
    })
}

extension Color {
    init(hex: Int64) {
        let red = Double((hex >> 16) & 0xFF) / 255.0
        let green = Double((hex >> 8) & 0xFF) / 255.0
        let blue = Double(hex & 0xFF) / 255.0
        let alpha = Double((hex >> 24) & 0xFF) / 255.0
        self.init(.sRGB, red: red, green: green, blue: blue, opacity: alpha > 0 ? alpha : 1.0)
    }
    
    init(dynamicProvider: @escaping (UITraitCollection) -> Int64) {
        self.init(UIColor { trait in
            let hex = dynamicProvider(trait)
            let red = CGFloat((hex >> 16) & 0xFF) / 255.0
            let green = CGFloat((hex >> 8) & 0xFF) / 255.0
            let blue = CGFloat(hex & 0xFF) / 255.0
            let alpha = CGFloat((hex >> 24) & 0xFF) / 255.0
            return UIColor(red: red, green: green, blue: blue, alpha: alpha > 0 ? alpha : 1.0)
        })
    }
}

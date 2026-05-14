import Foundation

// Fallback design tokens for standalone iOS target.
enum DesignTokens {
    struct LightColors {
        let Primary: Int = 0xFF007AFF
        let OnPrimary: Int = 0xFFFFFFFF
        let PrimaryContainer: Int = 0xFFE5F1FF
        let OnPrimaryContainer: Int = 0xFF0A2A4A

        let Secondary: Int = 0xFF5E5CE6
        let OnSecondary: Int = 0xFFFFFFFF
        let SecondaryContainer: Int = 0xFFE8E7FF
        let OnSecondaryContainer: Int = 0xFF20204A

        let Tertiary: Int = 0xFF34C759
        let OnTertiary: Int = 0xFFFFFFFF
        let TertiaryContainer: Int = 0xFFE8FAED
        let OnTertiaryContainer: Int = 0xFF0D3A1D

        let Background: Int = 0xFFFFFFFF
        let OnBackground: Int = 0xFF111111
        let Surface: Int = 0xFFF6F6F7
        let OnSurface: Int = 0xFF111111
        let SurfaceVariant: Int = 0xFFECEDEF
        let OnSurfaceVariant: Int = 0xFF4A4D55

        let Error: Int = 0xFFFF3B30
        let OnError: Int = 0xFFFFFFFF
        let ErrorContainer: Int = 0xFFFFE7E6
        let OnErrorContainer: Int = 0xFF4D120F

        let Outline: Int = 0xFFB7BBC3
        let OutlineVariant: Int = 0xFFD8DBE1
        let InversePrimary: Int = 0xFF8EC8FF
        let InverseSurface: Int = 0xFF1E1F22
        let InverseOnSurface: Int = 0xFFF4F4F5
        let SurfaceTint: Int = 0xFF007AFF
        let Scrim: Int = 0xFF000000

        let SurfaceBright: Int = 0xFFFFFFFF
        let SurfaceDim: Int = 0xFFECEDEF
        let SurfaceContainer: Int = 0xFFF2F3F5
        let SurfaceContainerHigh: Int = 0xFFE9EBEE
        let SurfaceContainerHighest: Int = 0xFFE1E4E8
        let SurfaceContainerLow: Int = 0xFFF7F8F9
        let SurfaceContainerLowest: Int = 0xFFFFFFFF
    }

    struct DarkColors {
        let Primary: Int = 0xFF4DA3FF
        let OnPrimary: Int = 0xFF001A33
        let PrimaryContainer: Int = 0xFF003B70
        let OnPrimaryContainer: Int = 0xFFD6E9FF

        let Secondary: Int = 0xFF8A88FF
        let OnSecondary: Int = 0xFF18173D
        let SecondaryContainer: Int = 0xFF2D2A60
        let OnSecondaryContainer: Int = 0xFFE1DFFF

        let Tertiary: Int = 0xFF69D98A
        let OnTertiary: Int = 0xFF093116
        let TertiaryContainer: Int = 0xFF14552A
        let OnTertiaryContainer: Int = 0xFFD7F6E1

        let Background: Int = 0xFF0F1012
        let OnBackground: Int = 0xFFECEDEF
        let Surface: Int = 0xFF17191C
        let OnSurface: Int = 0xFFECEDEF
        let SurfaceVariant: Int = 0xFF2A2D33
        let OnSurfaceVariant: Int = 0xFFC4C8D0

        let Error: Int = 0xFFFF6E66
        let OnError: Int = 0xFF3B0A07
        let ErrorContainer: Int = 0xFF5E1310
        let OnErrorContainer: Int = 0xFFFFDAD7

        let Outline: Int = 0xFF8F949F
        let OutlineVariant: Int = 0xFF3D4149
        let InversePrimary: Int = 0xFF007AFF
        let InverseSurface: Int = 0xFFECEDEF
        let InverseOnSurface: Int = 0xFF232528
        let SurfaceTint: Int = 0xFF4DA3FF
        let Scrim: Int = 0xFF000000

        let SurfaceBright: Int = 0xFF2A2D33
        let SurfaceDim: Int = 0xFF111315
        let SurfaceContainer: Int = 0xFF1B1D21
        let SurfaceContainerHigh: Int = 0xFF23262B
        let SurfaceContainerHighest: Int = 0xFF2B2F35
        let SurfaceContainerLow: Int = 0xFF17191C
        let SurfaceContainerLowest: Int = 0xFF0E1012
    }

    struct Spacing {
        let xs: Double = 4
        let sm: Double = 8
        let md: Double = 12
        let lg: Double = 16
        let xl: Double = 20
        let xxl: Double = 24
    }

    struct Typography {
        let displayLarge: Int32 = 57
        let displayMedium: Int32 = 45
        let displaySmall: Int32 = 36
        let headlineLarge: Int32 = 32
        let headlineMedium: Int32 = 28
        let headlineSmall: Int32 = 24
        let titleLarge: Int32 = 22
        let titleMedium: Int32 = 16
        let titleSmall: Int32 = 14
        let bodyLarge: Int32 = 16
        let bodyMedium: Int32 = 14
        let bodySmall: Int32 = 12
        let labelLarge: Int32 = 14
        let labelMedium: Int32 = 12
        let labelSmall: Int32 = 11
    }
}

package com.lepos.lepos.designtokens

/**
 * Shared design tokens for visual consistency across platforms.
 * 
 * Android: Map to Material 3 Expressive theme
 * iOS: Map to SwiftUI Color/Spacing extensions
 */
object DesignTokens {
    
    object Colors {
        // Base Palette (Common)
        const val Primary = 0xFF6200EE
        const val PrimaryVariant = 0xFF3700B3
        const val Secondary = 0xFF03DAC6
        const val SecondaryVariant = 0xFF018786
        
        const val OnPrimary = 0xFFFFFFFF
        const val OnSecondary = 0xFF000000
    }
    
    object LightColors {
        const val Primary = 0xFF6750A4
        const val OnPrimary = 0xFFFFFFFF
        const val PrimaryContainer = 0xFFEADDFF
        const val OnPrimaryContainer = 0xFF21005D
        const val InversePrimary = 0xFFD0BCFF
        
        const val Secondary = 0xFF625B71
        const val OnSecondary = 0xFFFFFFFF
        const val SecondaryContainer = 0xFFE8DEF8
        const val OnSecondaryContainer = 0xFF1D192B
        
        const val Tertiary = 0xFF7D5260
        const val OnTertiary = 0xFFFFFFFF
        const val TertiaryContainer = 0xFFFFD8E4
        const val OnTertiaryContainer = 0xFF31111D
        
        const val Error = 0xFFB3261E
        const val OnError = 0xFFFFFFFF
        const val ErrorContainer = 0xFFF9DEDC
        const val OnErrorContainer = 0xFF410E0B
        
        const val Background = 0xFFFFFBFE
        const val OnBackground = 0xFF1C1B1F
        
        const val Surface = 0xFFFFFBFE
        const val OnSurface = 0xFF1C1B1F
        const val SurfaceVariant = 0xFFE7E0EC
        const val OnSurfaceVariant = 0xFF49454F
        const val SurfaceTint = 0xFF6750A4
        const val InverseSurface = 0xFF313033
        const val InverseOnSurface = 0xFFF4EFF4
        
        const val Outline = 0xFF79747E
        const val OutlineVariant = 0xFFCAC4D0
        const val Scrim = 0xFF000000
        
        const val SurfaceBright = 0xFFFFFBFE
        const val SurfaceDim = 0xFFDED8E1
        const val SurfaceContainer = 0xFFF3EDF7
        const val SurfaceContainerHigh = 0xFFECE6F0
        const val SurfaceContainerHighest = 0xFFE6E0E9
        const val SurfaceContainerLow = 0xFFF7F2FA
        const val SurfaceContainerLowest = 0xFFFFFFFF
    }
    
    object DarkColors {
        const val Primary = 0xFFD0BCFF
        const val OnPrimary = 0xFF381E72
        const val PrimaryContainer = 0xFF4F378B
        const val OnPrimaryContainer = 0xFFEADDFF
        const val InversePrimary = 0xFF6750A4
        
        const val Secondary = 0xFFCCC2DC
        const val OnSecondary = 0xFF332D41
        const val SecondaryContainer = 0xFF4A4458
        const val OnSecondaryContainer = 0xFFE8DEF8
        
        const val Tertiary = 0xFFEFB8C8
        const val OnTertiary = 0xFF492532
        const val TertiaryContainer = 0xFF633B48
        const val OnTertiaryContainer = 0xFFFFD8E4
        
        const val Error = 0xFFF2B8B5
        const val OnError = 0xFF601410
        const val ErrorContainer = 0xFF8C1D18
        const val OnErrorContainer = 0xFFF9DEDC
        
        const val Background = 0xFF1C1B1F
        const val OnBackground = 0xFFE6E1E5
        
        const val Surface = 0xFF1C1B1F
        const val OnSurface = 0xFFE6E1E5
        const val SurfaceVariant = 0xFF49454F
        const val OnSurfaceVariant = 0xFFCAC4D0
        const val SurfaceTint = 0xFFD0BCFF
        const val InverseSurface = 0xFFE6E1E5
        const val InverseOnSurface = 0xFF313033
        
        const val Outline = 0xFF938F99
        const val OutlineVariant = 0xFF49454F
        const val Scrim = 0xFF000000
        
        const val SurfaceBright = 0xFF3B383E
        const val SurfaceDim = 0xFF141218
        const val SurfaceContainer = 0xFF211F26
        const val SurfaceContainerHigh = 0xFF2B2930
        const val SurfaceContainerHighest = 0xFF36343B
        const val SurfaceContainerLow = 0xFF1D1B20
        const val SurfaceContainerLowest = 0xFF0F0D13
    }
    
    object Spacing {
        const val xs = 4
        const val sm = 8
        const val md = 16
        const val lg = 24
        const val xl = 32
        const val xxl = 48
    }
    
    object Typography {
        // Font sizes in sp
        const val displayLarge = 57
        const val displayMedium = 45
        const val displaySmall = 36
        const val headlineLarge = 32
        const val headlineMedium = 28
        const val headlineSmall = 24
        const val titleLarge = 22
        const val titleMedium = 16
        const val titleSmall = 14
        const val bodyLarge = 16
        const val bodyMedium = 14
        const val bodySmall = 12
        const val labelLarge = 14
        const val labelMedium = 12
        const val labelSmall = 11
    }
    
    object Motion {
        // Animation durations in milliseconds
        const val durationInstant = 0
        const val durationFast = 100
        const val durationMedium = 300
        const val durationSlow = 500
        
        // Easing curves (for platform-specific interpolators)
        const val easingStandard = "cubic-bezier(0.4, 0.0, 0.2, 1)"
        const val easingDecelerate = "cubic-bezier(0.0, 0.0, 0.2, 1)"
        const val easingAccelerate = "cubic-bezier(0.4, 0.0, 1, 1)"
    }
}

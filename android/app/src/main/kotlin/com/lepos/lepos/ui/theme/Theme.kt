package com.lepos.lepos.ui.theme

/**
 * LeposTheme - Material 3 Expressive Theme
 *
 * Uses shared DesignTokens for visual consistency with iOS,
 * but implements Material 3 design language for Android.
 */

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import com.lepos.lepos.designtokens.DesignTokens

private val LightColorScheme = lightColorScheme(
    primary = Color(DesignTokens.LightColors.Primary),
    onPrimary = Color(DesignTokens.LightColors.OnPrimary),
    primaryContainer = Color(DesignTokens.LightColors.PrimaryContainer),
    onPrimaryContainer = Color(DesignTokens.LightColors.OnPrimaryContainer),
    inversePrimary = Color(DesignTokens.LightColors.InversePrimary),

    secondary = Color(DesignTokens.LightColors.Secondary),
    onSecondary = Color(DesignTokens.LightColors.OnSecondary),
    secondaryContainer = Color(DesignTokens.LightColors.SecondaryContainer),
    onSecondaryContainer = Color(DesignTokens.LightColors.OnSecondaryContainer),

    tertiary = Color(DesignTokens.LightColors.Tertiary),
    onTertiary = Color(DesignTokens.LightColors.OnTertiary),
    tertiaryContainer = Color(DesignTokens.LightColors.TertiaryContainer),
    onTertiaryContainer = Color(DesignTokens.LightColors.OnTertiaryContainer),

    background = Color(DesignTokens.LightColors.Background),
    onBackground = Color(DesignTokens.LightColors.OnBackground),

    surface = Color(DesignTokens.LightColors.Surface),
    onSurface = Color(DesignTokens.LightColors.OnSurface),
    surfaceVariant = Color(DesignTokens.LightColors.SurfaceVariant),
    onSurfaceVariant = Color(DesignTokens.LightColors.OnSurfaceVariant),
    surfaceTint = Color(DesignTokens.LightColors.SurfaceTint),
    inverseSurface = Color(DesignTokens.LightColors.InverseSurface),
    inverseOnSurface = Color(DesignTokens.LightColors.InverseOnSurface),

    error = Color(DesignTokens.LightColors.Error),
    onError = Color(DesignTokens.LightColors.OnError),
    errorContainer = Color(DesignTokens.LightColors.ErrorContainer),
    onErrorContainer = Color(DesignTokens.LightColors.OnErrorContainer),

    outline = Color(DesignTokens.LightColors.Outline),
    outlineVariant = Color(DesignTokens.LightColors.OutlineVariant),
    scrim = Color(DesignTokens.LightColors.Scrim),

    surfaceBright = Color(DesignTokens.LightColors.SurfaceBright),
    surfaceDim = Color(DesignTokens.LightColors.SurfaceDim),
    surfaceContainer = Color(DesignTokens.LightColors.SurfaceContainer),
    surfaceContainerHigh = Color(DesignTokens.LightColors.SurfaceContainerHigh),
    surfaceContainerHighest = Color(DesignTokens.LightColors.SurfaceContainerHighest),
    surfaceContainerLow = Color(DesignTokens.LightColors.SurfaceContainerLow),
    surfaceContainerLowest = Color(DesignTokens.LightColors.SurfaceContainerLowest)
)

private val DarkColorScheme = darkColorScheme(
    primary = Color(DesignTokens.DarkColors.Primary),
    onPrimary = Color(DesignTokens.DarkColors.OnPrimary),
    primaryContainer = Color(DesignTokens.DarkColors.PrimaryContainer),
    onPrimaryContainer = Color(DesignTokens.DarkColors.OnPrimaryContainer),
    inversePrimary = Color(DesignTokens.DarkColors.InversePrimary),

    secondary = Color(DesignTokens.DarkColors.Secondary),
    onSecondary = Color(DesignTokens.DarkColors.OnSecondary),
    secondaryContainer = Color(DesignTokens.DarkColors.SecondaryContainer),
    onSecondaryContainer = Color(DesignTokens.DarkColors.OnSecondaryContainer),

    tertiary = Color(DesignTokens.DarkColors.Tertiary),
    onTertiary = Color(DesignTokens.DarkColors.OnTertiary),
    tertiaryContainer = Color(DesignTokens.DarkColors.TertiaryContainer),
    onTertiaryContainer = Color(DesignTokens.DarkColors.OnTertiaryContainer),

    background = Color(DesignTokens.DarkColors.Background),
    onBackground = Color(DesignTokens.DarkColors.OnBackground),

    surface = Color(DesignTokens.DarkColors.Surface),
    onSurface = Color(DesignTokens.DarkColors.OnSurface),
    surfaceVariant = Color(DesignTokens.DarkColors.SurfaceVariant),
    onSurfaceVariant = Color(DesignTokens.DarkColors.OnSurfaceVariant),
    surfaceTint = Color(DesignTokens.DarkColors.SurfaceTint),
    inverseSurface = Color(DesignTokens.DarkColors.InverseSurface),
    inverseOnSurface = Color(DesignTokens.DarkColors.InverseOnSurface),

    error = Color(DesignTokens.DarkColors.Error),
    onError = Color(DesignTokens.DarkColors.OnError),
    errorContainer = Color(DesignTokens.DarkColors.ErrorContainer),
    onErrorContainer = Color(DesignTokens.DarkColors.OnErrorContainer),

    outline = Color(DesignTokens.DarkColors.Outline),
    outlineVariant = Color(DesignTokens.DarkColors.OutlineVariant),
    scrim = Color(DesignTokens.DarkColors.Scrim),

    surfaceBright = Color(DesignTokens.DarkColors.SurfaceBright),
    surfaceDim = Color(DesignTokens.DarkColors.SurfaceDim),
    surfaceContainer = Color(DesignTokens.DarkColors.SurfaceContainer),
    surfaceContainerHigh = Color(DesignTokens.DarkColors.SurfaceContainerHigh),
    surfaceContainerHighest = Color(DesignTokens.DarkColors.SurfaceContainerHighest),
    surfaceContainerLow = Color(DesignTokens.DarkColors.SurfaceContainerLow),
    surfaceContainerLowest = Color(DesignTokens.DarkColors.SurfaceContainerLowest)
)

@Composable
fun LeposTheme(
    darkTheme: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) {
        DarkColorScheme
    } else {
        LightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = LeposTypography,
        content = content
    )
}

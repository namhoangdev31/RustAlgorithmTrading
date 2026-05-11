package com.lepos.lepos.ui.theme


import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.lepos.lepos.R
import com.lepos.lepos.designtokens.DesignTokens

val robotoFontFamily = FontFamily(
    Font(R.font.roboto_black, FontWeight.Black),
    Font(R.font.roboto_extrabold, FontWeight.ExtraBold),
    Font(R.font.roboto_bold, FontWeight.Bold),
    Font(R.font.roboto_semibold, FontWeight.SemiBold),
    Font(R.font.roboto_medium, FontWeight.Medium),
    Font(R.font.roboto_regular, FontWeight.Normal),
    Font(R.font.roboto_light, FontWeight.Light),
    Font(R.font.roboto_thin, FontWeight.Thin),
    Font(R.font.roboto_extralight, FontWeight.ExtraLight)
)

/**
 * Material 3 Typography mapped from shared DesignTokens
 */
val LeposTypography = Typography(
    displayLarge = TextStyle(
        fontFamily = robotoFontFamily,
        fontSize = DesignTokens.Typography.displayLarge.sp,
        fontWeight = FontWeight.Normal,
        lineHeight = 64.sp
    ), displayMedium = TextStyle(
        fontFamily = robotoFontFamily,
        fontSize = DesignTokens.Typography.displayMedium.sp,
        fontWeight = FontWeight.Normal,
        lineHeight = 52.sp
    ), displaySmall = TextStyle(
        fontFamily = robotoFontFamily,
        fontSize = DesignTokens.Typography.displaySmall.sp,
        fontWeight = FontWeight.Normal,
        lineHeight = 44.sp
    ), headlineLarge = TextStyle(
        fontFamily = robotoFontFamily,
        fontSize = DesignTokens.Typography.headlineLarge.sp,
        fontWeight = FontWeight.Normal,
        lineHeight = 40.sp
    ), headlineMedium = TextStyle(
        fontFamily = robotoFontFamily,
        fontSize = DesignTokens.Typography.headlineMedium.sp,
        fontWeight = FontWeight.Normal,
        lineHeight = 36.sp
    ), headlineSmall = TextStyle(
        fontFamily = robotoFontFamily,
        fontSize = DesignTokens.Typography.headlineSmall.sp,
        fontWeight = FontWeight.Normal,
        lineHeight = 32.sp
    ), titleLarge = TextStyle(
        fontFamily = robotoFontFamily,
        fontSize = DesignTokens.Typography.titleLarge.sp,
        fontWeight = FontWeight.Medium,
        lineHeight = 28.sp
    ), titleMedium = TextStyle(
        fontFamily = robotoFontFamily,
        fontSize = DesignTokens.Typography.titleMedium.sp,
        fontWeight = FontWeight.Medium,
        lineHeight = 24.sp
    ), titleSmall = TextStyle(
        fontFamily = robotoFontFamily,
        fontSize = DesignTokens.Typography.titleSmall.sp,
        fontWeight = FontWeight.Medium,
        lineHeight = 20.sp
    ), bodyLarge = TextStyle(
        fontFamily = robotoFontFamily,
        fontSize = DesignTokens.Typography.bodyLarge.sp,
        fontWeight = FontWeight.Normal,
        lineHeight = 24.sp
    ), bodyMedium = TextStyle(
        fontFamily = robotoFontFamily,
        fontSize = DesignTokens.Typography.bodyMedium.sp,
        fontWeight = FontWeight.Normal,
        lineHeight = 20.sp
    ), bodySmall = TextStyle(
        fontFamily = robotoFontFamily,
        fontSize = DesignTokens.Typography.bodySmall.sp,
        fontWeight = FontWeight.Normal,
        lineHeight = 16.sp
    ), labelLarge = TextStyle(
        fontFamily = robotoFontFamily,
        fontSize = DesignTokens.Typography.labelLarge.sp,
        fontWeight = FontWeight.Medium,
        lineHeight = 20.sp
    ), labelMedium = TextStyle(
        fontFamily = robotoFontFamily,
        fontSize = DesignTokens.Typography.labelMedium.sp,
        fontWeight = FontWeight.Medium,
        lineHeight = 16.sp
    ), labelSmall = TextStyle(
        fontFamily = robotoFontFamily,
        fontSize = DesignTokens.Typography.labelSmall.sp,
        fontWeight = FontWeight.Medium,
        lineHeight = 16.sp
    )
)

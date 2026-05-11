package com.lepos.lepos.navigation

import kotlinx.serialization.Serializable

/**
 * Shared route definitions for navigation.
 * 
 * Platform-specific navigation implementations will map these routes:
 * - Android: Navigation Compose destinations (Type-Safe)
 * - iOS: SwiftUI NavigationPath
 */
@Serializable
sealed class Route {
    @Serializable
    data object Login : Route()
    
    @Serializable
    data object Onboarding : Route()
    
    @Serializable
    data object Main : Route()

    
    @Serializable
    data object Home : Route()

    @Serializable
    data object ForYou : Route()
    
    @Serializable
    data class Profile(val userId: String) : Route()
    
    @Serializable
    data class Detail(val itemId: String) : Route()
    
    @Serializable
    data class CollectionDetail(val id: String, val title: String) : Route()
    
    @Serializable
    data class CategoryDetail(val id: String, val title: String) : Route()
    
    @Serializable
    data object Updates : Route()

    @Serializable
    data object TopCharts : Route()

    @Serializable
    data object MyReviews : Route()

    @Serializable
    data object NotificationPreferences : Route()
    
    @Serializable
    data object Settings : Route()
    
    @Serializable
    data object EditProfile : Route()
    
    @Serializable
    data object DownloadHistory : Route()

    @Serializable
    data class WriteReview(val appId: String) : Route()
    
    @Serializable
    data class Developer(val id: String) : Route()

    @Serializable
    data class AllReviews(val appId: String) : Route()
    
    @Serializable
    data object Activity : Route()
    
    @Serializable
    data object HelpSupport : Route()

    @Serializable
    data object AboutApp : Route()

    @Serializable
    data class Legal(val type: String) : Route()

    @Serializable
    data object GlobalError : Route()

    @Serializable
    data object NoInternet : Route()

    @Serializable
    data object ForceUpdate : Route()

    @Serializable
    data object RateLimit : Route()

    @Serializable
    data object ForgotPassword : Route()
    
    @Serializable
    data class InstallProgress(val appId: String) : Route()

    @Serializable
    data class AppStorage(val appId: String) : Route()

    @Serializable
    data class VersionHistory(val appId: String) : Route()

    @Serializable
    data class Permissions(val appId: String) : Route()

    @Serializable
    data object AccountOverview : Route()

    @Serializable
    data object Devices : Route()

    @Serializable
    data object Security : Route()

    @Serializable
    data object Notifications : Route()

    @Serializable
    data class NotificationDetail(val id: String) : Route()

    @Serializable
    data class ReviewDetail(val id: String) : Route()

    @Serializable
    data object ReportReview : Route()

    @Serializable
    data object ReviewGuidelines : Route()

    @Serializable
    data class Checkout(val appId: String, val price: Double) : Route()

    @Serializable
    data object PaymentMethods : Route()

    @Serializable
    data object AddCard : Route()

    @Serializable
    data object ConnectWallet : Route()

    @Serializable
    data object Wallet : Route()

    @Serializable
    data object Verification : Route()

    @Serializable
    data object PaymentSuccess : Route()

    @Serializable
    data object PaymentFailed : Route()
    @Serializable
    data class MiniApp(val manifestJson: String, val bundlePath: String) : Route()

    @Serializable
    data object DeleteAccount : Route()
}

package com.lepos.lepos.domain.model.bundle

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class Bundle(
    // ── IDENTITY ─────────────────────────────────
    val id: String,
    val bundleKey: String? = null,
    val name: String,
    val slug: String? = null,
    val version: String,
    val buildNumber: Int = 1,

    // ── DISPLAY ──────────────────────────────────
    val iconUrl: String? = null,
    val bannerUrl: String? = null,
    val shortDescription: String? = null,
    val description: String? = null,
    val privacyPolicyUrl: String? = null,
    val supportUrl: String? = null,
    val websiteUrl: String? = null,

    // ── DEVELOPER ────────────────────────────────
    val developerName: String? = null,
    val developerId: String? = null,
    val developerEmail: String? = null,

    // ── CATEGORIZATION ───────────────────────────
    val category: String? = null,
    val subCategory: String? = null,

    // ── STORAGE ──────────────────────────────────
    val storagePath: String,
    val bucket: String,
    val fileSize: Long? = null,
    val checksum: String? = null,

    // ── PRICING ──────────────────────────────────
    val price: Double? = null,
    val currency: String? = null,
    val isFree: Boolean = true,
    val isOneTimePayment: Boolean = false,
    val hasInAppPurchases: Boolean = false,
    val hasSubscription: Boolean = false,

    // ── PUBLISHING / LIFECYCLE ───────────────────
    val status: String = "draft",
    val rejectionReason: String? = null,
    val publishedAt: Instant? = null,
    val expiresAt: Instant? = null,
    val changelog: String? = null,
    val releaseNotes: String? = null,
    val minOsVersion: String? = null,
    val runtimeType: String = "standard",

    // ── RATINGS (Aggregated) ─────────────────────
    val rating: Double? = null,
    val ratingCount: Int = 0,
    val rating1: Int = 0,
    val rating2: Int = 0,
    val rating3: Int = 0,
    val rating4: Int = 0,
    val rating5: Int = 0,

    // ── STORE METADATA ───────────────────────────
    val ageRating: String? = null,
    val contentAdvisory: String? = null,
    val downloadCount: Long = 0,
    val activeInstalls: Long = 0,
    val isFeatured: Boolean = false,
    val isVerified: Boolean = false,
    val isEditorChoice: Boolean = false,
    val featuredOrder: Int? = null,

    // ── TIMESTAMPS ───────────────────────────────
    val createdAt: Instant,
    val updatedAt: Instant,
    val deletedAt: Instant? = null,

    // ── CHILD ENTITIES ───────────────────────────
    val screenshots: List<BundleScreenshot> = emptyList(),
    val tags: List<BundleTag> = emptyList(),
    val languages: List<BundleLanguage> = emptyList(),
    val inAppPurchases: List<BundleInAppPurchase> = emptyList()
) {
    init {
        // Validation logic
        require(price == null || price >= 0) { "Price cannot be negative" }
        require(rating == null || (rating in 0.0..5.0)) { "Rating must be between 0 and 5" }
        require(ratingCount >= 0) { "Rating count cannot be negative" }
        require(downloadCount >= 0) { "Download count cannot be negative" }
        require(activeInstalls >= 0) { "Active installs cannot be negative" }
    }
}

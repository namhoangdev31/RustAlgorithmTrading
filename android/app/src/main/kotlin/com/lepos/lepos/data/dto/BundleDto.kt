package com.lepos.lepos.data.dto

import kotlinx.serialization.Serializable

@Serializable
data class BundleDto(
    // ── IDENTITY ─────────────────────────────────
    val id: String,
    val bundleKey: String? = null,
    val name: String,
    val slug: String? = null,
    val version: String = "1.0.0",
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
    val storagePath: String? = null,
    val bucket: String? = null,
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
    val publishedAt: Long? = null,
    val expiresAt: Long? = null,
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
    val createdAt: Long = 0,
    val updatedAt: Long = 0,
    val deletedAt: Long? = null,

    // ── CHILD ENTITIES ───────────────────────────
    val screenshots: List<BundleScreenshotDto> = emptyList(),
    val tags: List<BundleTagDto> = emptyList(),
    val languages: List<BundleLanguageDto> = emptyList(),
    val inAppPurchases: List<BundleInAppPurchaseDto> = emptyList(),
    
    // Kept for backward compatibility if needed, though they map to other fields now
    val imagesIntroduce: List<String>? = null
)

@Serializable
data class BundleScreenshotDto(
    val url: String,
    val caption: String? = null,
    val deviceType: String? = null,
    val sortOrder: Int = 0
)

@Serializable
data class BundleTagDto(
    val tag: String
)

@Serializable
data class BundleLanguageDto(
    val languageCode: String,
    val languageName: String? = null
)

@Serializable
data class BundleInAppPurchaseDto(
    val productId: String,
    val name: String,
    val description: String? = null,
    val price: Double,
    val currency: String = "VND",
    val purchaseType: String
)

package com.lepos.lepos.data.mapper

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import com.lepos.lepos.data.dto.BundleDto
import com.lepos.lepos.domain.model.bundle.*

@OptIn(ExperimentalTime::class)
fun BundleDto.toDomain(): Bundle {
    return Bundle(
        id = id,
        bundleKey = bundleKey,
        name = name,
        slug = slug,
        version = version,
        buildNumber = buildNumber,

        iconUrl = iconUrl,
        bannerUrl = bannerUrl,
        shortDescription = shortDescription,
        description = description,
        privacyPolicyUrl = privacyPolicyUrl,
        supportUrl = supportUrl,
        websiteUrl = websiteUrl,

        developerName = developerName,
        developerId = developerId,
        developerEmail = developerEmail,

        category = category,
        subCategory = subCategory,

        storagePath = storagePath ?: "",
        bucket = bucket ?: "",
        fileSize = fileSize,
        checksum = checksum,

        price = price,
        currency = currency,
        isFree = isFree,
        isOneTimePayment = isOneTimePayment,
        hasInAppPurchases = hasInAppPurchases,
        hasSubscription = hasSubscription,

        status = status,
        rejectionReason = rejectionReason,
        publishedAt = publishedAt?.let { Instant.fromEpochMilliseconds(it) },
        expiresAt = expiresAt?.let { Instant.fromEpochMilliseconds(it) },
        changelog = changelog,
        releaseNotes = releaseNotes,
        minOsVersion = minOsVersion,
        runtimeType = runtimeType,

        rating = rating,
        ratingCount = ratingCount,
        rating1 = rating1,
        rating2 = rating2,
        rating3 = rating3,
        rating4 = rating4,
        rating5 = rating5,

        ageRating = ageRating,
        contentAdvisory = contentAdvisory,
        downloadCount = downloadCount,
        activeInstalls = activeInstalls,
        isFeatured = isFeatured,
        isVerified = isVerified,
        isEditorChoice = isEditorChoice,
        featuredOrder = featuredOrder,

        createdAt = Instant.fromEpochMilliseconds(createdAt),
        updatedAt = Instant.fromEpochMilliseconds(updatedAt),
        deletedAt = deletedAt?.let { Instant.fromEpochMilliseconds(it) },

        screenshots = screenshots.map { it.toDomain(id) }.ifEmpty { 
            // Fallback for backward comp
            imagesIntroduce?.mapIndexed { index, url -> 
                BundleScreenshot(
                    id = "",
                    bundleId = id,
                    url = url, 
                    sortOrder = index,
                    createdAt = Instant.fromEpochMilliseconds(0)
                ) 
            } ?: emptyList()
        },
        tags = tags.map { it.toDomain(id) },
        languages = languages.map { it.toDomain(id) },
        inAppPurchases = inAppPurchases.map { it.toDomain(id) }
    )
}

@OptIn(ExperimentalTime::class)
fun com.lepos.lepos.data.dto.BundleScreenshotDto.toDomain(bundleId: String) = BundleScreenshot(
    id = "",
    bundleId = bundleId,
    url = url,
    caption = caption,
    deviceType = deviceType,
    sortOrder = sortOrder,
    createdAt = Instant.fromEpochMilliseconds(0)
)

fun com.lepos.lepos.data.dto.BundleTagDto.toDomain(bundleId: String) = BundleTag(
    id = "",
    bundleId = bundleId,
    tag = tag
)

fun com.lepos.lepos.data.dto.BundleLanguageDto.toDomain(bundleId: String) = BundleLanguage(
    id = "",
    bundleId = bundleId,
    languageCode = languageCode,
    languageName = languageName
)

@OptIn(ExperimentalTime::class)
fun com.lepos.lepos.data.dto.BundleInAppPurchaseDto.toDomain(bundleId: String) = BundleInAppPurchase(
    id = "",
    bundleId = bundleId,
    productId = productId,
    name = name,
    description = description,
    price = price,
    currency = currency,
    purchaseType = purchaseType,
    createdAt = Instant.fromEpochMilliseconds(0)
)

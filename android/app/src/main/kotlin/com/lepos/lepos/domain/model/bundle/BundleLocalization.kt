package com.lepos.lepos.domain.model.bundle

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundleLocalization(
    val id: String,
    val bundleId: String,
    val languageCode: String,
    val localizedName: String?,
    val localizedShortDesc: String?,
    val localizedDescription: String?,
    val localizedChangelog: String?,
    val createdAt: Instant,
    val updatedAt: Instant
)

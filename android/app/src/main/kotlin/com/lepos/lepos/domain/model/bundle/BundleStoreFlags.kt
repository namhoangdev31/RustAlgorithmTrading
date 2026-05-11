package com.lepos.lepos.domain.model.bundle

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundleStoreFlags(
    val id: String,
    val bundleId: String,
    val isFeatured: Boolean = false,
    val isVerified: Boolean = false,
    val isEditorChoice: Boolean = false,
    val featuredOrder: Int?,
    val updatedAt: Instant
)

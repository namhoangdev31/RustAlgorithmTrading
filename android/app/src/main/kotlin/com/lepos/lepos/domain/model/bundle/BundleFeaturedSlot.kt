package com.lepos.lepos.domain.model.bundle

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundleFeaturedSlot(
    val id: String,
    val bundleId: String,
    val slotType: String,
    val title: String?,
    val subtitle: String?,
    val bannerUrl: String?,
    val ctaLabel: String?,
    val region: String?,
    val sortOrder: Int = 0,
    val startsAt: Instant,
    val endsAt: Instant?,
    val isActive: Boolean = true,
    val createdAt: Instant,
    val updatedAt: Instant
)

package com.lepos.lepos.domain.model.bundle

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundlePromotion(
    val id: String,
    val bundleId: String,
    val promoCode: String?,
    val promoType: String,
    val discountValue: Double,
    val maxRedemptions: Int?,
    val currentRedemptions: Int = 0,
    val minOrderAmount: Double?,
    val startsAt: Instant,
    val endsAt: Instant?,
    val isActive: Boolean = true,
    val createdAt: Instant,
    val updatedAt: Instant
)

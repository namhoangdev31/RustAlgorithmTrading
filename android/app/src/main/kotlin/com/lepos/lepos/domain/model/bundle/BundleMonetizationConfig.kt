package com.lepos.lepos.domain.model.bundle

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundleMonetizationConfig(
    val id: String,
    val bundleId: String,
    val monetizationType: String = "free",
    val defaultPriceTier: String?,
    val revenueSharePercent: Double = 30.0,
    val trialPeriodDays: Int = 0,
    val adsEnabled: Boolean = false,
    val adsProvider: String?,
    val crossSellEnabled: Boolean = false,
    val updatedAt: Instant,
    val createdAt: Instant
)

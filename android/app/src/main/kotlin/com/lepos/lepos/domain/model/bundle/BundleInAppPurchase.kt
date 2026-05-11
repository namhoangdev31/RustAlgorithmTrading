package com.lepos.lepos.domain.model.bundle

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundleInAppPurchase(
    val id: String,
    val bundleId: String,
    val productId: String,
    val name: String,
    val description: String? = null,
    val price: Double,
    val currency: String = "VND",
    val purchaseType: String,
    val createdAt: Instant
)

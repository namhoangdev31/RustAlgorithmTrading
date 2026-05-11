package com.lepos.lepos.domain.model.commerce

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundleUserEntitlement(
    val id: String,
    val userId: String,
    val bundleId: String,
    val orderId: String?,
    val entitlementType: String,
    val expiresAt: Instant?,
    val isActive: Boolean = true,
    val createdAt: Instant,
    val updatedAt: Instant
)

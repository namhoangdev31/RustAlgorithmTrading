package com.lepos.lepos.domain.model.bundle

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundleSubscriptionPlan(
    val id: String,
    val bundleId: String,
    val planKey: String,
    val name: String,
    val description: String?,
    val price: Double,
    val currency: String = "VND",
    val billingPeriod: String,
    val trialDays: Int = 0,
    val isActive: Boolean = true,
    val createdAt: Instant,
    val updatedAt: Instant
)

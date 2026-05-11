package com.lepos.lepos.domain.model.commerce

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundleSubscriptionHistory(
    val id: String,
    val userId: String,
    val planId: String,
    val bundleId: String,
    val startAt: Instant,
    val endAt: Instant?,
    val status: String = "active",
    val cancelReason: String?,
    val createdAt: Instant,
    val updatedAt: Instant
)

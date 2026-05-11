package com.lepos.lepos.domain.model.bundle

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundleWebhook(
    val id: String,
    val bundleId: String,
    val url: String,
    val secret: String?,
    val events: String, // JSON array
    val isActive: Boolean = true,
    val failureCount: Int = 0,
    val lastTriggeredAt: Instant?,
    val createdAt: Instant,
    val updatedAt: Instant
)

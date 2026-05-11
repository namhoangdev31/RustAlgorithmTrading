package com.lepos.lepos.domain.model.bundle

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundleAnalyticsEvent(
    val id: String,
    val bundleId: String,
    val userId: String?,
    val sessionId: String?,
    val eventType: String,
    val eventData: String?, // JSON
    val platformVersion: String?,
    val bundleVersion: String?,
    val ipAddress: String?,
    val createdAt: Instant
)

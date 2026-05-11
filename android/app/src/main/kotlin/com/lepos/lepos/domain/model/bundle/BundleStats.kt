package com.lepos.lepos.domain.model.bundle

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundleStats(
    val id: String,
    val bundleId: String,
    val rating: Double?,
    val ratingCount: Int = 0,
    val rating1: Int = 0,
    val rating2: Int = 0,
    val rating3: Int = 0,
    val rating4: Int = 0,
    val rating5: Int = 0,
    val downloadCount: Long = 0,
    val activeInstalls: Long = 0,
    val updatedAt: Instant
)

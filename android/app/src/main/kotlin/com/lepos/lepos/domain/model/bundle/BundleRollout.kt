package com.lepos.lepos.domain.model.bundle

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundleRollout(
    val id: String,
    val bundleId: String,
    val trackId: String,
    val rolloutPercent: Int = 0,
    val targetCountry: String?,
    val startedAt: Instant,
    val completedAt: Instant?,
    val createdAt: Instant
)

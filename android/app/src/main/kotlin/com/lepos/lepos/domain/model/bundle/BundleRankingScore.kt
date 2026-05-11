package com.lepos.lepos.domain.model.bundle

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundleRankingScore(
    val id: String,
    val bundleId: String,
    val popularityScore: Double = 0.0,
    val retentionScore: Double = 0.0,
    val qualityScore: Double = 0.0,
    val crashScore: Double = 0.0,
    val overallScore: Double = 0.0,
    val updatedAt: Instant
)

package com.lepos.lepos.domain.model.bundle

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundleAbuseSignal(
    val id: String,
    val bundleId: String,
    val fakeReviewScore: Double = 0.0,
    val suspiciousInstallRate: Double = 0.0,
    val anomalyScore: Double = 0.0,
    val clickFarmScore: Double = 0.0,
    val ratingManipulationScore: Double = 0.0,
    val overallRiskScore: Double = 0.0,
    val riskLevel: String = "low",
    val lastCalculatedAt: Instant,
    val flaggedForReview: Boolean = false
)

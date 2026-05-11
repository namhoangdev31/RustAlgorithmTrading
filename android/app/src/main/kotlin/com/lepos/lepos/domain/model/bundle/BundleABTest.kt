package com.lepos.lepos.domain.model.bundle

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundleABTest(
    val id: String,
    val bundleId: String,
    val testName: String,
    val hypothesis: String?,
    val variantAConfig: String, // JSON
    val variantBConfig: String, // JSON
    val metric: String,
    val trafficSplit: Int = 50,
    val status: String = "draft",
    val winnerVariant: String?,
    val startedAt: Instant?,
    val endedAt: Instant?,
    val createdAt: Instant
)

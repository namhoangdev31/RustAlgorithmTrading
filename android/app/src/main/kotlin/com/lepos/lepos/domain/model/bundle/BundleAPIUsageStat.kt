package com.lepos.lepos.domain.model.bundle

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundleAPIUsageStat(
    val id: String,
    val bundleId: String,
    val statsDate: String,
    val endpoint: String,
    val method: String,
    val callCount: Long = 0,
    val errorCount: Long = 0,
    val avgLatencyMs: Double?,
    val p99LatencyMs: Double?,
    val createdAt: Instant
)

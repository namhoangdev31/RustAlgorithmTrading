package com.lepos.lepos.domain.model.bundle

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundleRetentionStat(
    val id: String,
    val bundleId: String,
    val statsDate: String,
    val d1Retention: Double?,
    val d7Retention: Double?,
    val d30Retention: Double?,
    val dau: Long = 0,
    val mau: Long = 0,
    val sessionCount: Long = 0,
    val avgSessionDuration: Double?,
    val createdAt: Instant
)

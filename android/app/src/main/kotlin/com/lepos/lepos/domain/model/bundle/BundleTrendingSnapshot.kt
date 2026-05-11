package com.lepos.lepos.domain.model.bundle

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundleTrendingSnapshot(
    val id: String,
    val bundleId: String,
    val snapshotDate: String,
    val downloadCount: Long = 0,
    val activeInstalls: Long = 0,
    val rankPosition: Int?,
    val category: String?,
    val createdAt: Instant
)

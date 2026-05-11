package com.lepos.lepos.domain.model.bundle

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundleUpdatePhase(
    val id: String,
    val bundleId: String,
    val versionId: String,
    val phaseOrder: Int,
    val percentage: Int,
    val targetCountry: String?,
    val startedAt: Instant?,
    val endedAt: Instant?,
    val status: String = "pending",
    val createdAt: Instant
)

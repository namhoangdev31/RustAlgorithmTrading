package com.lepos.lepos.domain.model.bundle

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundleReviewQueue(
    val id: String,
    val bundleId: String,
    val submittedVersionId: String?,
    val status: String = "pending",
    val reviewerId: String?,
    val priority: Int = 0,
    val reviewedAt: Instant?,
    val notes: String?,
    val createdAt: Instant,
    val updatedAt: Instant
)

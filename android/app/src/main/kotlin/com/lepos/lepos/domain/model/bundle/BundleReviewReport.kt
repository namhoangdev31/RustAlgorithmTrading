package com.lepos.lepos.domain.model.bundle

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundleReviewReport(
    val id: String,
    val reviewId: String,
    val reportedBy: String,
    val reason: String,
    val description: String?,
    val status: String = "pending",
    val reviewedBy: String?,
    val createdAt: Instant,
    val updatedAt: Instant
)

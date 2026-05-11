package com.lepos.lepos.domain.model.bundle

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundleUserReport(
    val id: String,
    val bundleId: String,
    val reportedBy: String,
    val reason: String,
    val description: String?,
    val evidenceUrls: String?, // JSON array
    val status: String = "pending",
    val reviewedBy: String?,
    val resolution: String?,
    val createdAt: Instant,
    val updatedAt: Instant
)

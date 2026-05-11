package com.lepos.lepos.domain.model.bundle

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundleReviewHistory(
    val id: String,
    val bundleId: String,
    val versionId: String?,
    val action: String,
    val actorId: String,
    val reason: String?,
    val metadata: String?, // JSON
    val createdAt: Instant
)

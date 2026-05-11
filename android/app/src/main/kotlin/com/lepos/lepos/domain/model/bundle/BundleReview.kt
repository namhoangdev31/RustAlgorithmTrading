package com.lepos.lepos.domain.model.bundle

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundleReview(
    val id: String,
    val bundleId: String,
    val userId: String,
    val rating: Int,
    val title: String?,
    val body: String?,
    val isVerified: Boolean = false,
    val developerReply: String?,
    val helpfulCount: Int = 0,
    val reportCount: Int = 0,
    val createdAt: Instant,
    val updatedAt: Instant
)

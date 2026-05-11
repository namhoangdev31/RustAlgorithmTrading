package com.lepos.lepos.domain.model.bundle

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundleContentRating(
    val id: String,
    val bundleId: String,
    val ratingBoard: String,
    val rating: String,
    val descriptors: String?, // JSON array
    val createdAt: Instant
)

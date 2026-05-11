package com.lepos.lepos.domain.model.bundle

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundleChangeLog(
    val id: String,
    val bundleId: String,
    val entityType: String,
    val entityId: String,
    val changeType: String,
    val diff: String, // JSON patch
    val changedBy: String?,
    val createdAt: Instant
)

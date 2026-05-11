package com.lepos.lepos.domain.model.bundle

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundleVersionHistory(
    val id: String,
    val bundleId: String,
    val version: String,
    val buildNumber: Int,
    val storagePath: String,
    val fileSize: Long?,
    val changelog: String?,
    val status: String = "archived",
    val publishedAt: Instant?,
    val createdAt: Instant
)

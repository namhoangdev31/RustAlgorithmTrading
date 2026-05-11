package com.lepos.lepos.domain.model.bundle

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundleReleaseTrack(
    val id: String,
    val bundleId: String,
    val track: String,
    val version: String,
    val buildNumber: Int,
    val storagePath: String,
    val releaseNotes: String?,
    val status: String = "active",
    val createdAt: Instant
)

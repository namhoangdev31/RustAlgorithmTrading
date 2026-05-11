package com.lepos.lepos.domain.model.bundle

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundleCrashReport(
    val id: String,
    val bundleId: String,
    val versionId: String?,
    val deviceModel: String?,
    val osVersion: String?,
    val platform: String?,
    val stackTraceHash: String,
    val stackTrace: String?,
    val occurrenceCount: Int = 1,
    val affectedUsers: Int = 1,
    val firstSeen: Long,
    val lastSeen: Long,
    val isResolved: Boolean = false,
    val createdAt: Instant,
    val updatedAt: Instant
)

package com.lepos.lepos.domain.model.bundle

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundleCollaborator(
    val id: String,
    val bundleId: String,
    val userId: String,
    val role: String = "editor",
    val invitedBy: String?,
    val acceptedAt: Instant?,
    val createdAt: Instant
)

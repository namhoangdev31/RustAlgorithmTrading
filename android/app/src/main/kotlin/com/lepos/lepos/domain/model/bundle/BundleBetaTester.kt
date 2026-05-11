package com.lepos.lepos.domain.model.bundle

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundleBetaTester(
    val id: String,
    val bundleId: String,
    val userId: String?,
    val email: String,
    val inviteCode: String?,
    val status: String = "invited",
    val expiresAt: Instant?,
    val createdAt: Instant
)

package com.lepos.lepos.domain.model.bundle

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundleDeveloperStrike(
    val id: String,
    val developerId: String,
    val bundleId: String?,
    val strikeType: String,
    val severity: String = "minor",
    val description: String,
    val issuedBy: String?,
    val expiresAt: Instant?,
    val createdAt: Instant
)

package com.lepos.lepos.domain.model.bundle

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundleExternalIntegration(
    val id: String,
    val bundleId: String,
    val integrationType: String,
    val displayName: String,
    val config: String, // JSON
    val isActive: Boolean = true,
    val lastSyncAt: Instant?,
    val createdAt: Instant,
    val updatedAt: Instant
)

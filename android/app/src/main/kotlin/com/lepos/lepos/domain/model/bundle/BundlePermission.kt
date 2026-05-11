package com.lepos.lepos.domain.model.bundle

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundlePermission(
    val id: String,
    val bundleId: String,
    val permissionKey: String,
    val permissionLabel: String?,
    val isRequired: Boolean = true,
    val rationale: String?,
    val createdAt: Instant
)

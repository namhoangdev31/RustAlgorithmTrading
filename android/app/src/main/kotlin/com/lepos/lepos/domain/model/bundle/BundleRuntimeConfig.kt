package com.lepos.lepos.domain.model.bundle

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundleRuntimeConfig(
    val id: String,
    val bundleId: String,
    val minOsVersion: String?,
    val runtimeType: String = "standard",
    val targetPlatforms: String?,
    val sdkVersion: String?,
    val offlineSupported: Boolean = false,
    val updatedAt: Instant
)

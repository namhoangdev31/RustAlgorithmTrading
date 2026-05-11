package com.lepos.lepos.domain.model.bundle

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundleAdConfiguration(
    val id: String,
    val bundleId: String,
    val provider: String,
    val appId: String,
    val bannerId: String?,
    val interstitialId: String?,
    val rewardedId: String?,
    val nativeId: String?,
    val isTestMode: Boolean = false,
    val isActive: Boolean = true,
    val createdAt: Instant,
    val updatedAt: Instant
)

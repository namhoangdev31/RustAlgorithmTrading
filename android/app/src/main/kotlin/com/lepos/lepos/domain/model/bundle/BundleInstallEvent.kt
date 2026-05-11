package com.lepos.lepos.domain.model.bundle

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundleInstallEvent(
    val id: String,
    val bundleId: String,
    val userId: String,
    val eventType: String,
    val deviceId: String?,
    val platform: String?,
    val osVersion: String?,
    val bundleVersion: String?,
    val countryCode: String?,
    val createdAt: Instant
)

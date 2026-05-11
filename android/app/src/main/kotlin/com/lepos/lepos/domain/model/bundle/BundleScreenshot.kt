package com.lepos.lepos.domain.model.bundle

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundleScreenshot(
    val id: String,
    val bundleId: String,
    val url: String,
    val caption: String? = null,
    val deviceType: String? = null,
    val sortOrder: Int = 0,
    val createdAt: Instant
)

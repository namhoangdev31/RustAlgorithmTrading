package com.lepos.lepos.domain.model.bundle

import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundleDeviceSupport(
    val id: String,
    val bundleId: String,
    val deviceModel: String,
    val platform: String,
    val minOs: String?,
    val maxOs: String?,
    val isSupported: Boolean = true,
    val notes: String?
)

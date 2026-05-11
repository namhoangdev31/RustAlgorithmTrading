package com.lepos.lepos.domain.model.bundle

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundleDependency(
    val id: String,
    val bundleId: String,
    val dependencyBundleId: String,
    val dependencyBundleKey: String?,
    val minVersion: String?,
    val maxVersion: String?,
    val isOptional: Boolean = false,
    val createdAt: Instant
)

package com.lepos.lepos.domain.model.bundle

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundleStoreListing(
    val id: String,
    val bundleId: String,
    val region: String,
    val name: String?,
    val shortDescription: String?,
    val description: String?,
    val isActive: Boolean = true,
    val createdAt: Instant
)

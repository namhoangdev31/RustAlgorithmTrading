package com.lepos.lepos.domain.model.bundle

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundleAuditLog(
    val id: String,
    val bundleId: String,
    val userId: String?,
    val action: String,
    val fieldName: String?,
    val oldValue: String?,
    val countryCode: String?,
    val createdAt: Instant
)

package com.lepos.lepos.domain.model.bundle

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundlePrivacyDeclaration(
    val id: String,
    val bundleId: String,
    val collectsPersonalData: Boolean = false,
    val dataTypes: String?, // JSON
    val purposeOfCollection: String?,
    val thirdPartySharing: Boolean = false,
    val thirdParties: String?, // JSON
    val dataRetentionDays: Int?,
    val privacyContactEmail: String?,
    val updatedAt: Instant,
    val createdAt: Instant
)

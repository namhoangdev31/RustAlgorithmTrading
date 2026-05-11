package com.lepos.lepos.domain.model.bundle

import kotlinx.serialization.Serializable

@Serializable
data class BundleCountry(
    val id: String,
    val bundleId: String,
    val countryCode: String,
    val isAvailable: Boolean = true,
    val priceOverride: Double?,
    val currency: String?
)

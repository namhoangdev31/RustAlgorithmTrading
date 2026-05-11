package com.lepos.lepos.domain.model.bundle

import kotlinx.serialization.Serializable

@Serializable
data class BundleSearchKeyword(
    val id: String,
    val bundleId: String,
    val keyword: String,
    val locale: String = "en",
    val weight: Int = 1
)

package com.lepos.lepos.domain.model.bundle

import kotlinx.serialization.Serializable

@Serializable
data class BundleTag(
    val id: String,
    val bundleId: String,
    val tag: String
)

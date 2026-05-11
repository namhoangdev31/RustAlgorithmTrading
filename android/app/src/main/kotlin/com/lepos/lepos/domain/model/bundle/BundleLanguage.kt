package com.lepos.lepos.domain.model.bundle

import kotlinx.serialization.Serializable

@Serializable
data class BundleLanguage(
    val id: String,
    val bundleId: String,
    val languageCode: String,
    val languageName: String? = null
)

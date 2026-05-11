package com.lepos.lepos.data.dto

import kotlinx.serialization.Serializable

@Serializable
data class FeaturedAppDto(
    val id: String,
    val processedId: String,
    val badge: String,
    val title: String,
    val subtitle: String,
    val backgroundImageUrl: String,
    val app: MiniAppDto? = null
)

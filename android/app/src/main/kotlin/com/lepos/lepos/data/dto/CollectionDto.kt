package com.lepos.lepos.data.dto

import kotlinx.serialization.Serializable

@Serializable
data class CollectionDto(
    val id: String,
    val name: String,
    val subtitle: String,
    val coverImageUrl: String,
    val apps: List<MiniAppDto>
)

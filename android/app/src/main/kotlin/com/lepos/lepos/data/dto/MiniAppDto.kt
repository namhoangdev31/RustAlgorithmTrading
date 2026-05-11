package com.lepos.lepos.data.dto

import kotlinx.serialization.Serializable

@Serializable
data class MiniAppDto(
    val id: String,
    val name: String,
    val iconUrl: String,
    val category: String,
    val rating: Double,
    val developer: String,
    val price: String? = null
)

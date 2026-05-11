package com.lepos.lepos.domain.model

/**
 * Shared model for Home Screen items
 */
data class HomeItem(
    val id: String,
    val title: String,
    val subtitle: String,
    val imageUrl: String? = null
)

data class HomeState(
    val isLoading: Boolean = false,
    val items: List<HomeItem> = emptyList(),
    val error: String? = null
)

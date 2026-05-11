package com.lepos.lepos.domain.model.today

data class FeaturedApp(
    val id: String,
    val processedId: String,
    val badge: String,
    val title: String,
    val subtitle: String,
    val backgroundImageUrl: String,
    val app: MiniApp? = null
)

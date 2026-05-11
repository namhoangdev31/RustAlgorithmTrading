package com.lepos.lepos.domain.model.today

data class AppCollection(
    val id: String,
    val name: String,
    val subtitle: String,
    val coverImageUrl: String,
    val apps: List<MiniApp>
)

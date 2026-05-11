package com.lepos.lepos.domain.model.today

data class MiniApp(
    val id: String,
    val name: String,
    val iconUrl: String,
    val category: String,
    val rating: Double,
    val developer: String,
    val price: String? = null
)

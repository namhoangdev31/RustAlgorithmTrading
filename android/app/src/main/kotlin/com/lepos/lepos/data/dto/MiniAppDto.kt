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

@Serializable
data class MiniAppStatsDto(
    val id: String,
    val installedCount: Int = 0,
    val sessionCount: Long = 0L,
    val avgSessionDuration: Long = 0L,
    val dailyActiveUsers: Int = 0,
    val activeUsers7Days: Int = 0,
    val activeUsers30Days: Int = 0,
    val retentionRate: Double = 0.0,
    val crs: Double = 0.0,
    val downloadsLast24Hours: Int = 0,
    val downloadsLast7Days: Int = 0
)

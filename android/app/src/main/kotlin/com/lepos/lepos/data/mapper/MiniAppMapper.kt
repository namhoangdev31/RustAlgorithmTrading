package com.lepos.lepos.data.mapper

import com.lepos.lepos.data.dto.MiniAppDto
import com.lepos.lepos.data.dto.MiniAppStatsDto
import com.lepos.lepos.domain.model.today.MiniApp
import com.lepos.lepos.domain.repository.MiniAppStats

fun MiniAppDto.toDomain(): MiniApp {
    return MiniApp(
        id = id,
        name = name,
        iconUrl = iconUrl,
        category = category,
        rating = rating,
        developer = developer,
        price = price
    )
}

fun MiniApp.toDto(): MiniAppDto {
    return MiniAppDto(
        id = id,
        name = name,
        iconUrl = iconUrl,
        category = category,
        rating = rating,
        developer = developer,
        price = price
    )
}

fun MiniAppStatsDto.toDomain(): MiniAppStats {
    return MiniAppStats(
        id = id,
        installedCount = installedCount,
        sessionCount = sessionCount,
        avgSessionDuration = avgSessionDuration,
        dailyActiveUsers = dailyActiveUsers,
        activeUsers7Days = activeUsers7Days,
        activeUsers30Days = activeUsers30Days,
        retentionRate = retentionRate,
        crs = crs,
        downloadsLast24Hours = downloadsLast24Hours,
        downloadsLast7Days = downloadsLast7Days
    )
}

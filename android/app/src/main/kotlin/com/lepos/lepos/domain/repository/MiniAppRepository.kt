package com.lepos.lepos.domain.repository

import com.lepos.lepos.domain.model.today.MiniApp
import kotlinx.coroutines.flow.Flow

interface MiniAppRepository {
    // Get all mini apps with filtering and pagination
    fun getAllMiniApps(
        category: String? = null,
        search: String? = null,
        limit: Int = 50,
        offset: Int = 0
    ): Flow<List<MiniApp>>

    // Get mini app by ID
    fun getMiniAppById(id: String): Flow<MiniApp?>

    // Get mini apps by category
    fun getMiniAppsByCategory(category: String): Flow<List<MiniApp>>

    // Get featured mini apps
    fun getFeaturedMiniApps(): Flow<List<MiniApp>>

    // Get mini apps by developer
    fun getMiniAppsByDeveloper(developer: String): Flow<List<MiniApp>>

    // Search mini apps
    fun searchMiniApps(query: String): Flow<List<MiniApp>>

    // Get mini app details
    fun getMiniAppDetails(id: String): Flow<MiniAppWithDetails>

    // Create new mini app
    suspend fun createMiniApp(miniApp: MiniApp): MiniApp

    // Update mini app
    suspend fun updateMiniApp(id: String, miniApp: MiniApp): MiniApp

    // Delete mini app
    suspend fun deleteMiniApp(id: String): Boolean

    // Get stats for a mini app
    fun getMiniAppStats(id: String): Flow<MiniAppStats>

    // Get all mini app stats
    fun getAllMiniAppStats(): Flow<List<MiniAppStats>>
}

data class MiniAppWithDetails(
    val app: MiniApp,
    val installedCount: Int = 0,
    val sessionCount: Long = 0L,
    val avgSessionDuration: Long = 0L,
    val dailyActiveUsers: Int = 0,
    val activeUsers7Days: Int = 0,
    val activeUsers30Days: Int = 0,
    val retentionRate: Double = 0.0,
    val crs: Double = 0.0
)

data class MiniAppStats(
    val id: String,
    val installedCount: Int,
    val sessionCount: Long,
    val avgSessionDuration: Long,
    val dailyActiveUsers: Int,
    val activeUsers7Days: Int,
    val activeUsers30Days: Int,
    val retentionRate: Double,
    val crs: Double,
    val downloadsLast24Hours: Int,
    val downloadsLast7Days: Int
)
package com.lepos.lepos.domain.usecase

import com.lepos.lepos.domain.repository.MiniAppRepository
import com.lepos.lepos.domain.model.today.MiniApp
import kotlinx.coroutines.flow.*

class MiniAppUseCase(private val repository: MiniAppRepository) {

    // Get all mini apps with filtering and pagination
    fun getAllMiniApps(
        category: String? = null,
        search: String? = null,
        limit: Int = 50,
        offset: Int = 0
    ): StateFlow<List<MiniApp>> = repository.getAllMiniApps(
        category = category,
        search = search,
        limit = limit,
        offset = offset
    )
        .catch { emit(emptyList()) }
        .stateIn(
            scope = CoroutineScope(Dispatchers.Main),
            initialValue = emptyList(),
            transformations = flowing(),
            start = Start.Eagerly
        )

    // Get mini app by ID
    fun getMiniAppById(id: String): StateFlow<MiniApp?> = repository.getMiniAppById(id)
        .catch { emit(null) }
        .stateIn(
            scope = CoroutineScope(Dispatchers.Main),
            initialValue = null,
            transformations = flowing(),
            start = Start.Eagerly
        )

    // Get mini apps by category
    fun getMiniAppsByCategory(category: String): StateFlow<List<MiniApp>> = repository.getMiniAppsByCategory(
        category = category
    )
        .catch { emit(emptyList()) }
        .stateIn(
            scope = CoroutineScope(Dispatchers.Main),
            initialValue = emptyList(),
            transformations = flowing(),
            start = Start.Eagerly
        )

    // Get featured mini apps
    fun getFeaturedMiniApps(): StateFlow<List<MiniApp>> = repository.getFeaturedMiniApps()
        .catch { emit(emptyList()) }
        .stateIn(
            scope = CoroutineScope(Dispatchers.Main),
            initialValue = emptyList(),
            transformations = flowing(),
            start = Start.Eagerly
        )

    // Get mini apps by developer
    fun getMiniAppsByDeveloper(developer: String): StateFlow<List<MiniApp>> = repository.getMiniAppsByDeveloper(
        developer = developer
    )
        .catch { emit(emptyList()) }
        .stateIn(
            scope = CoroutineScope(Dispatchers.Main),
            initialValue = emptyList(),
            transformations = flowing(),
            start = Start.Eagerly
        )

    // Search mini apps
    fun searchMiniApps(query: String): StateFlow<List<MiniApp>> = repository.searchMiniApps(
        query = query
    )
        .catch { emit(emptyList()) }
        .stateIn(
            scope = CoroutineScope(Dispatchers.Main),
            initialValue = emptyList(),
            transformations = flowing(),
            start = Start.Eagerly
        )

    // Get mini app details
    fun getMiniAppDetails(id: String): StateFlow<MiniAppWithDetails> = repository.getMiniAppDetails(id)
        .catch { emit(MiniAppWithDetails(
            app = MiniApp(
                id = "",
                name = "",
                description = "",
                iconUrl = "",
                packageName = "",
                developer = "",
                category = "",
                version = "",
                size = 0,
                rating = 0.0,
                downloadCount = 0,
                isInstalled = false
            ),
            installedCount = 0,
            sessionCount = 0L,
            avgSessionDuration = 0L,
            dailyActiveUsers = 0,
            activeUsers7Days = 0,
            activeUsers30Days = 0,
            retentionRate = 0.0,
            crs = 0.0
        )) }
        .stateIn(
            scope = CoroutineScope(Dispatchers.Main),
            initialValue = MiniAppWithDetails(
                app = MiniApp(
                    id = "",
                    name = "",
                    description = "",
                    iconUrl = "",
                    packageName = "",
                    developer = "",
                    category = "",
                    version = "",
                    size = 0,
                    rating = 0.0,
                    downloadCount = 0,
                    isInstalled = false
                ),
                installedCount = 0,
                sessionCount = 0L,
                avgSessionDuration = 0L,
                dailyActiveUsers = 0,
                activeUsers7Days = 0,
                activeUsers30Days = 0,
                retentionRate = 0.0,
                crs = 0.0
            ),
            transformations = flowing(),
            start = Start.Eagerly
        )

    // Create new mini app
    suspend fun createMiniApp(miniApp: MiniApp): MiniApp = repository.createMiniApp(miniApp)

    // Update mini app
    suspend fun updateMiniApp(id: String, miniApp: MiniApp): MiniApp = repository.updateMiniApp(id, miniApp)

    // Delete mini app
    suspend fun deleteMiniApp(id: String): Boolean = repository.deleteMiniApp(id)

    // Get stats for a mini app
    fun getMiniAppStats(id: String): StateFlow<MiniAppStats> = repository.getMiniAppStats(id)
        .catch { emit(MiniAppStats(
            id = id,
            installedCount = 0,
            sessionCount = 0L,
            avgSessionDuration = 0L,
            dailyActiveUsers = 0,
            activeUsers7Days = 0,
            activeUsers30Days = 0,
            retentionRate = 0.0,
            crs = 0.0,
            downloadsLast24Hours = 0,
            downloadsLast7Days = 0
        )) }
        .stateIn(
            scope = CoroutineScope(Dispatchers.Main),
            initialValue = MiniAppStats(
                id = id,
                installedCount = 0,
                sessionCount = 0L,
                avgSessionDuration = 0L,
                dailyActiveUsers = 0,
                activeUsers7Days = 0,
                activeUsers30Days = 0,
                retentionRate = 0.0,
                crs = 0.0,
                downloadsLast24Hours = 0,
                downloadsLast7Days = 0
            ),
            transformations = flowing(),
            start = Start.Eagerly
        )

    // Get all mini app stats
    fun getAllMiniAppStats(): StateFlow<List<MiniAppStats>> = repository.getAllMiniAppStats()
        .catch { emit(emptyList()) }
        .stateIn(
            scope = CoroutineScope(Dispatchers.Main),
            initialValue = emptyList(),
            transformations = flowing(),
            start = Start.Eagerly
        )
}
package com.lepos.lepos.domain.usecase

import com.lepos.lepos.domain.model.today.MiniApp
import com.lepos.lepos.domain.repository.MiniAppRepository
import com.lepos.lepos.domain.repository.MiniAppStats
import com.lepos.lepos.domain.repository.MiniAppWithDetails
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.stateIn

class MiniAppUseCase(private val repository: MiniAppRepository) {
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
            started = SharingStarted.Eagerly,
            initialValue = emptyList()
        )

    fun getMiniAppById(id: String): StateFlow<MiniApp?> = repository.getMiniAppById(id)
        .catch { emit(null) }
        .stateIn(
            scope = CoroutineScope(Dispatchers.Main),
            started = SharingStarted.Eagerly,
            initialValue = null
        )

    fun getMiniAppsByCategory(category: String): StateFlow<List<MiniApp>> = repository.getMiniAppsByCategory(category)
        .catch { emit(emptyList()) }
        .stateIn(
            scope = CoroutineScope(Dispatchers.Main),
            started = SharingStarted.Eagerly,
            initialValue = emptyList()
        )

    fun getFeaturedMiniApps(): StateFlow<List<MiniApp>> = repository.getFeaturedMiniApps()
        .catch { emit(emptyList()) }
        .stateIn(
            scope = CoroutineScope(Dispatchers.Main),
            started = SharingStarted.Eagerly,
            initialValue = emptyList()
        )

    fun getMiniAppsByDeveloper(developer: String): StateFlow<List<MiniApp>> = repository.getMiniAppsByDeveloper(developer)
        .catch { emit(emptyList()) }
        .stateIn(
            scope = CoroutineScope(Dispatchers.Main),
            started = SharingStarted.Eagerly,
            initialValue = emptyList()
        )

    fun searchMiniApps(query: String): StateFlow<List<MiniApp>> = repository.searchMiniApps(query)
        .catch { emit(emptyList()) }
        .stateIn(
            scope = CoroutineScope(Dispatchers.Main),
            started = SharingStarted.Eagerly,
            initialValue = emptyList()
        )

    fun getMiniAppDetails(id: String): StateFlow<MiniAppWithDetails> = repository.getMiniAppDetails(id)
        .catch { emit(MiniAppWithDetails(app = emptyMiniApp(id))) }
        .stateIn(
            scope = CoroutineScope(Dispatchers.Main),
            started = SharingStarted.Eagerly,
            initialValue = MiniAppWithDetails(app = emptyMiniApp(id))
        )

    suspend fun createMiniApp(miniApp: MiniApp): MiniApp = repository.createMiniApp(miniApp)

    suspend fun updateMiniApp(id: String, miniApp: MiniApp): MiniApp = repository.updateMiniApp(id, miniApp)

    suspend fun deleteMiniApp(id: String): Boolean = repository.deleteMiniApp(id)

    fun getMiniAppStats(id: String): StateFlow<MiniAppStats> = repository.getMiniAppStats(id)
        .catch { emit(emptyStats(id)) }
        .stateIn(
            scope = CoroutineScope(Dispatchers.Main),
            started = SharingStarted.Eagerly,
            initialValue = emptyStats(id)
        )

    fun getAllMiniAppStats(): StateFlow<List<MiniAppStats>> = repository.getAllMiniAppStats()
        .catch { emit(emptyList()) }
        .stateIn(
            scope = CoroutineScope(Dispatchers.Main),
            started = SharingStarted.Eagerly,
            initialValue = emptyList()
        )

    private fun emptyMiniApp(id: String): MiniApp {
        return MiniApp(
            id = id,
            name = "",
            iconUrl = "",
            category = "",
            rating = 0.0,
            developer = ""
        )
    }

    private fun emptyStats(id: String): MiniAppStats {
        return MiniAppStats(
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
        )
    }
}

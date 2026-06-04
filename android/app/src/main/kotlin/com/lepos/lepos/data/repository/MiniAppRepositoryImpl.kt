package com.lepos.lepos.data.repository

import com.lepos.lepos.data.mapper.toDomain
import com.lepos.lepos.data.mapper.toDto
import com.lepos.lepos.data.remote.MiniAppRemoteDataSource
import com.lepos.lepos.domain.model.today.MiniApp
import com.lepos.lepos.domain.repository.MiniAppRepository
import com.lepos.lepos.domain.repository.MiniAppStats
import com.lepos.lepos.domain.repository.MiniAppWithDetails
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.flow

class MiniAppRepositoryImpl(
    private val remoteDataSource: MiniAppRemoteDataSource
) : MiniAppRepository {
    override fun getAllMiniApps(
        category: String?,
        search: String?,
        limit: Int,
        offset: Int
    ): Flow<List<MiniApp>> {
        return flow {
            emit(
                remoteDataSource.getAllMiniApps(
                    category = category,
                    search = search,
                    limit = limit,
                    offset = offset
                ).map { it.toDomain() }
            )
        }.catch {
            emit(emptyList())
        }
    }

    override fun getMiniAppById(id: String): Flow<MiniApp?> {
        return flow<MiniApp?> {
            emit(remoteDataSource.getMiniAppById(id).toDomain())
        }.catch {
            emit(null)
        }
    }

    override fun getMiniAppsByCategory(category: String): Flow<List<MiniApp>> {
        return getAllMiniApps(category = category)
    }

    override fun getFeaturedMiniApps(): Flow<List<MiniApp>> {
        return flow {
            emit(remoteDataSource.getFeaturedMiniApps().map { it.toDomain() })
        }.catch {
            emit(emptyList())
        }
    }

    override fun getMiniAppsByDeveloper(developer: String): Flow<List<MiniApp>> {
        return flow {
            emit(
                remoteDataSource.getAllMiniApps(
                    category = null,
                    search = null,
                    limit = Int.MAX_VALUE,
                    offset = 0
                )
                    .map { it.toDomain() }
                    .filter { it.developer.equals(developer, ignoreCase = true) }
            )
        }.catch {
            emit(emptyList())
        }
    }

    override fun searchMiniApps(query: String): Flow<List<MiniApp>> {
        return getAllMiniApps(search = query)
    }

    override fun getMiniAppDetails(id: String): Flow<MiniAppWithDetails> {
        return flow {
            emit(MiniAppWithDetails(app = remoteDataSource.getMiniAppById(id).toDomain()))
        }.catch {
            emit(MiniAppWithDetails(app = emptyMiniApp(id)))
        }
    }

    override suspend fun createMiniApp(miniApp: MiniApp): MiniApp {
        return remoteDataSource.createMiniApp(miniApp.toDto()).toDomain()
    }

    override suspend fun updateMiniApp(id: String, miniApp: MiniApp): MiniApp {
        return remoteDataSource.updateMiniApp(id, miniApp.toDto()).toDomain()
    }

    override suspend fun deleteMiniApp(id: String): Boolean {
        remoteDataSource.deleteMiniApp(id)
        return true
    }

    override fun getMiniAppStats(id: String): Flow<MiniAppStats> {
        return flow {
            emit(remoteDataSource.getMiniAppStats(id).toDomain())
        }.catch {
            emit(statsFor(id))
        }
    }

    override fun getAllMiniAppStats(): Flow<List<MiniAppStats>> {
        return flow {
            val apps = remoteDataSource.getAllMiniApps(
                category = null,
                search = null,
                limit = Int.MAX_VALUE,
                offset = 0
            )
            val stats = apps.map { app ->
                runCatching { remoteDataSource.getMiniAppStats(app.id).toDomain() }
                    .getOrElse { statsFor(app.id) }
            }
            emit(stats)
        }.catch {
            emit(emptyList())
        }
    }

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

    private fun statsFor(id: String): MiniAppStats {
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

object MiniAppRepositoryWrapper {
    fun getRepository(remoteDataSource: MiniAppRemoteDataSource): MiniAppRepository {
        return MiniAppRepositoryImpl(remoteDataSource)
    }
}

package com.lepos.lepos.data.repository

import com.lepos.lepos.data.network.MockApiService
import com.lepos.lepos.domain.model.today.MiniApp
import com.lepos.lepos.domain.repository.MiniAppRepository
import com.lepos.lepos.domain.usecase.MiniAppUseCase

/**
 * Repository implementation for MiniApp using Mock API Service
 * For production, replace MockApiService với real API service
 */
class MiniAppRepositoryImpl : MiniAppRepository {
    
    private val apiService: MockApiService = MockApiService()
    private val ktorClient: io.ktor.client.HttpClient? = 
        (javaClass.classLoader?.loadClass("KtorClientFactory")?.newInstance() as KtorClientFactory?)?.client
    
    override fun getMiniApps(userId: String, limit: Int = 50, offset: Int = 0): Flow<List<MiniApp>> = 
        apiService.getMiniApps(userId, limit, offset)
    
    override suspend fun getMiniAppById(id: String): MiniApp? = 
        apiService.getMiniAppById(id)
    
    override suspend fun createMiniApp(miniApp: MiniApp): MiniApp = 
        apiService.createMiniApp(miniApp)
    
    override suspend fun updateMiniApp(miniApp: MiniApp): MiniApp = 
        miniApp.copy()
}

/**
 * DI Wrapper for MiniAppRepository - Manual DI for shared module
 */
object MiniAppRepositoryWrapper {
    fun getRepository(): MiniAppRepository {
        return MiniAppRepositoryImpl()
    }
}
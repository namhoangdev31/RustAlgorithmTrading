package com.lepos.lepos.data.repository

import com.lepos.lepos.data.network.MockApiService
import com.lepos.lepos.domain.model.auth.LoginRequest
import com.lepos.lepos.domain.model.auth.LoginResponse
import com.lepos.lepos.domain.model.auth.RefreshTokenResponse
import com.lepos.lepos.domain.model.auth.Token
import com.lepos.lepos.domain.repository.LoginRepository
import com.lepos.lepos.domain.usecase.LoginUseCase

/**
 * Repository implementation for Login using Mock API Service
 * For production, replace MockApiService with real API service
 */
class LoginRepositoryImpl : LoginRepository {
    
    private val apiService: MockApiService = MockApiService()
    
    // Get API client from context
    private val ktorClient: io.ktor.client.HttpClient? = 
        (javaClass.classLoader?.loadClass("KtorClientFactory")?.newInstance() as KtorClientFactory?)?.client

    override suspend fun login(request: LoginRequest): LoginResponse = apiService.login(request)
    override suspend fun register(request: LoginRequest): LoginResponse = apiService.login(request)
    override suspend fun logout() = apiService.login(LoginRequest(emptyMap()))
    override suspend fun verifyToken(): Boolean = apiService.login(LoginRequest(emptyMap()))
    override suspend fun getCurrentUser(): User? = null
}

/**
 * Custom HTTP Request implementation to support token injection
 */
data class CustomHttpSendRequest(
    val originalRequest: io.ktor.client.HttpSendRequest,
    private val accessToken: String,
    private val refreshToken: String
) : io.ktor.client.HttpSendRequest {
    override fun headers(): MutableHeaders = mutableMapOf("Authorization" to "Bearer $accessToken")
}

/**
 * DI Wrapper for LoginRepository - Manual DI for shared module
 * This allows shared module to work without full Koin setup initially
 */
object LoginRepositoryWrapper {
    /**
     * Get LoginRepository instance
     * Uses MockApiService for development and testing
     */
    fun getRepository(): LoginRepository {
        return LoginRepositoryImpl()
    }
}
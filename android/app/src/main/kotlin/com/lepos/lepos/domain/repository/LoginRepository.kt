package com.lepos.lepos.domain.repository

import com.lepos.lepos.domain.model.DomainResult
import com.lepos.lepos.domain.model.auth.AuthTokenResponse

interface LoginRepository {
    // Legacy email/password (to be removed or refactored)
    suspend fun login(email: String, password: String): DomainResult<Boolean>

    // Firebase Auth
    suspend fun loginWithFirebase(idToken: String): DomainResult<AuthTokenResponse>
    
    // Token Management
    suspend fun refreshAccessToken(refreshToken: String): DomainResult<AuthTokenResponse>
    suspend fun getAccessToken(): String?
    suspend fun getRefreshToken(): String?
    suspend fun saveTokens(accessToken: String, refreshToken: String)
    suspend fun clearTokens()
}

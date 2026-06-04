package com.lepos.lepos.domain.usecase

import com.lepos.lepos.domain.model.DomainResult
import com.lepos.lepos.domain.model.auth.AuthTokenResponse
import com.lepos.lepos.domain.repository.LoginRepository

class LoginUseCase(private val repository: LoginRepository) {
    suspend fun execute(email: String, password: String): DomainResult<Boolean> {
        return repository.login(email, password)
    }

    suspend fun loginWithFirebase(idToken: String): DomainResult<AuthTokenResponse> {
        return repository.loginWithFirebase(idToken)
    }

    suspend fun refreshAccessToken(refreshToken: String): DomainResult<AuthTokenResponse> {
        return repository.refreshAccessToken(refreshToken)
    }

    suspend fun logout() {
        repository.clearTokens()
    }
}

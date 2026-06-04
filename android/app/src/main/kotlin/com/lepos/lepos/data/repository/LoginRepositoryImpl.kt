package com.lepos.lepos.data.repository

import com.lepos.lepos.domain.model.DomainResult
import com.lepos.lepos.domain.model.auth.AuthTokenResponse
import com.lepos.lepos.data.remote.AuthRemoteDataSource
import com.lepos.lepos.domain.repository.LoginRepository
import com.lepos.lepos.domain.repository.TokenStorage

class LoginRepositoryImpl(
    private val authRemoteDataSource: AuthRemoteDataSource,
    private val tokenStorage: TokenStorage
) : LoginRepository {

    override suspend fun login(email: String, password: String): DomainResult<Boolean> {
        return if (email.isBlank() || password.isBlank()) {
            DomainResult.Error("Email and password are required")
        } else {
            runCatching { authRemoteDataSource.login(email, password) }
                .fold(
                    onSuccess = { response ->
                        persist(response)
                        DomainResult.Success(true)
                    },
                    onFailure = { error ->
                        DomainResult.Error(error.message ?: "Login failed", error)
                    }
                )
        }
    }

    override suspend fun loginWithFirebase(idToken: String): DomainResult<AuthTokenResponse> {
        return if (idToken.isBlank()) {
            DomainResult.Error("Firebase token is required")
        } else {
            runCatching { authRemoteDataSource.loginWithFirebase(idToken) }
                .fold(
                    onSuccess = { response ->
                        persist(response)
                        DomainResult.Success(response)
                    },
                    onFailure = { error ->
                        DomainResult.Error(error.message ?: "Firebase login failed", error)
                    }
                )
        }
    }

    override suspend fun refreshAccessToken(refreshToken: String): DomainResult<AuthTokenResponse> {
        return if (refreshToken.isBlank()) {
            DomainResult.Error("Refresh token is required")
        } else {
            runCatching { authRemoteDataSource.refreshAccessToken(refreshToken) }
                .fold(
                    onSuccess = { response ->
                        persist(response)
                        DomainResult.Success(response)
                    },
                    onFailure = { error ->
                        DomainResult.Error(error.message ?: "Token refresh failed", error)
                    }
                )
        }
    }

    override suspend fun getAccessToken(): String? = tokenStorage.get("access_token")

    override suspend fun getRefreshToken(): String? = tokenStorage.get("refresh_token")

    override suspend fun saveTokens(accessToken: String, refreshToken: String) {
        tokenStorage.save("access_token", accessToken)
        tokenStorage.save("refresh_token", refreshToken)
    }

    override suspend fun clearTokens() {
        tokenStorage.clear()
    }

    private suspend fun persist(response: AuthTokenResponse) {
        saveTokens(
            accessToken = response.accessToken,
            refreshToken = response.refreshToken
        )
    }
}

object LoginRepositoryWrapper {
    fun getRepository(authRemoteDataSource: AuthRemoteDataSource, tokenStorage: TokenStorage): LoginRepository {
        return LoginRepositoryImpl(authRemoteDataSource, tokenStorage)
    }
}

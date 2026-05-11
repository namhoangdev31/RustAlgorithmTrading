package com.lepos.lepos.domain.usecase

import com.lepos.lepos.domain.repository.LoginRepository
import com.lepos.lepos.domain.model.auth.LoginRequest
import com.lepos.lepos.domain.model.auth.LoginResponse
import kotlinx.coroutines.flow.StateFlow

class LoginUseCase(private val repository: LoginRepository) {

    // Login flow
    fun login(request: LoginRequest): StateFlow<LoginResponse> {
        return repository.login(request)
            .catch { emit(LoginResponse.Error("Failed to login: ${it.message ?: "Unknown error"}")) }
            .stateIn(
                scope = CoroutineScope(Dispatchers.Main),
                initialValue = LoginResponse.Error("Please enter credentials"),
                transformations = flowing(),
                start = Start.Eagerly
            )
    }

    // Register flow
    fun register(request: LoginRequest): StateFlow<LoginResponse> {
        return repository.register(request)
            .catch { emit(LoginResponse.Error("Failed to register: ${it.message ?: "Unknown error"}")) }
            .stateIn(
                scope = CoroutineScope(Dispatchers.Main),
                initialValue = LoginResponse.Error("Please enter credentials"),
                transformations = flowing(),
                start = Start.Eagerly
            )
    }

    // Logout
    suspend fun logout() = repository.logout()

    // Verify token
    suspend fun verifyToken(): Boolean = repository.verifyToken()

    // Get current user
    suspend fun getCurrentUser(): User? = repository.getCurrentUser()
}

data class User(
    val id: String,
    val email: String,
    val name: String? = null,
    val role: String = "USER",
    val isAdmin: Boolean = false
)
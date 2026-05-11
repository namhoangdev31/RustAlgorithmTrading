package com.lepos.lepos.data.repository

import com.lepos.lepos.core.AppError
import com.lepos.lepos.core.Result
import com.lepos.lepos.data.mapper.toDomain
import com.lepos.lepos.data.remote.ApiService
import com.lepos.lepos.domain.model.User
import com.lepos.lepos.domain.repository.UserRepository

class UserRepositoryImpl(
    private val apiService: ApiService
) : UserRepository {

    override suspend fun getUsers(): Result<List<User>> {
        return try {
            val userDtos = apiService.getUsers()
            val users = userDtos.map { it.toDomain() }
            Result.Success(users)
        } catch (e: Exception) {
            Result.Error(AppError.NetworkError(message = e.message, cause = e))
        }
    }
}

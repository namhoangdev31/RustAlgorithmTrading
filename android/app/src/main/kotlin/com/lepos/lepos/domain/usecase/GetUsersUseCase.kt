package com.lepos.lepos.domain.usecase

import com.lepos.lepos.core.Result
import com.lepos.lepos.domain.model.User
import com.lepos.lepos.domain.repository.UserRepository

class GetUsersUseCase(
    private val repository: UserRepository
) {
    suspend operator fun invoke(): Result<List<User>> = repository.getUsers()
}

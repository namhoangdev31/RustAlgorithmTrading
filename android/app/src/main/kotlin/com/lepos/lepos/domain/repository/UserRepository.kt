package com.lepos.lepos.domain.repository

import com.lepos.lepos.core.Result
import com.lepos.lepos.domain.model.User

interface UserRepository {
    suspend fun getUsers(): Result<List<User>>
}

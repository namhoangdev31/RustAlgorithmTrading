package com.lepos.lepos.data.remote

import com.lepos.lepos.data.dto.UserDto
import com.lepos.lepos.data.dto.ApiResponseDto
import com.lepos.lepos.data.dto.FeaturedAppDto
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.get

class ApiService(
    private val client: HttpClient
) {
    suspend fun getUsers(): List<UserDto> =
        client.get("kmp-users").body()

    suspend fun getFeaturedApp(): ApiResponseDto<FeaturedAppDto> =
        client.get("featured-app").body()
}

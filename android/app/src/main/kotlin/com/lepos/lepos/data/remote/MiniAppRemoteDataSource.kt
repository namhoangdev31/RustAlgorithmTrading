package com.lepos.lepos.data.remote

import com.lepos.lepos.data.dto.MiniAppDto
import com.lepos.lepos.data.dto.MiniAppStatsDto
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.delete
import io.ktor.client.request.get
import io.ktor.client.request.parameter
import io.ktor.client.request.post
import io.ktor.client.request.put
import io.ktor.client.request.setBody

class MiniAppRemoteDataSource(
    private val client: HttpClient
) {
    suspend fun getAllMiniApps(
        category: String?,
        search: String?,
        limit: Int,
        offset: Int
    ): List<MiniAppDto> {
        return client.get("mini-apps") {
            category?.takeIf { it.isNotBlank() }?.let { parameter("category", it) }
            search?.takeIf { it.isNotBlank() }?.let { parameter("search", it) }
            parameter("limit", limit)
            parameter("offset", offset)
        }.body()
    }

    suspend fun getMiniAppById(id: String): MiniAppDto {
        return client.get("mini-apps/$id").body()
    }

    suspend fun getFeaturedMiniApps(): List<MiniAppDto> {
        return client.get("mini-apps/featured").body()
    }

    suspend fun createMiniApp(miniApp: MiniAppDto): MiniAppDto {
        return client.post("mini-apps") {
            setBody(miniApp)
        }.body()
    }

    suspend fun updateMiniApp(id: String, miniApp: MiniAppDto): MiniAppDto {
        return client.put("mini-apps/$id") {
            setBody(miniApp.copy(id = id))
        }.body()
    }

    suspend fun deleteMiniApp(id: String) {
        client.delete("mini-apps/$id")
    }

    suspend fun getMiniAppStats(id: String): MiniAppStatsDto {
        return client.get("mini-apps/$id/stats").body()
    }
}

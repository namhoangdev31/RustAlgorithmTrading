package com.lepos.lepos.data.remote

import com.lepos.lepos.domain.model.auth.AuthTokenResponse
import com.lepos.lepos.domain.model.auth.EmailPasswordLoginRequest
import com.lepos.lepos.domain.model.auth.FirebaseTokenRequest
import com.lepos.lepos.domain.model.auth.RefreshTokenRequest
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.post
import io.ktor.client.request.setBody

class AuthRemoteDataSource(
    private val client: HttpClient
) {
    suspend fun login(email: String, password: String): AuthTokenResponse {
        return client.post("auth/login") {
            setBody(EmailPasswordLoginRequest(email = email, password = password))
        }.body()
    }

    suspend fun loginWithFirebase(idToken: String): AuthTokenResponse {
        return client.post("auth/firebase") {
            setBody(FirebaseTokenRequest(idToken = idToken))
        }.body()
    }

    suspend fun refreshAccessToken(refreshToken: String): AuthTokenResponse {
        return client.post("auth/refresh") {
            setBody(RefreshTokenRequest(refreshToken = refreshToken))
        }.body()
    }
}

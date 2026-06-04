package com.lepos.lepos.domain.model.auth

import com.lepos.lepos.domain.model.user.User
import kotlinx.serialization.Serializable

@Serializable
data class FirebaseTokenRequest(
    val idToken: String
)

@Serializable
data class EmailPasswordLoginRequest(
    val email: String,
    val password: String
)

@Serializable
data class RefreshTokenRequest(
    val refreshToken: String
)

@Serializable
data class AuthTokenResponse(
    val accessToken: String,
    val refreshToken: String,
    val expiresIn: Long,
    val user: User
)

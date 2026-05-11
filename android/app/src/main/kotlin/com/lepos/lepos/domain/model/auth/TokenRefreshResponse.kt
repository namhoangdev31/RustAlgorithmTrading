package com.lepos.lepos.domain.model.auth

/**
 * Token Refresh Response
 * Returns new access token after refreshing with refresh token
 */
data class TokenRefreshResponse(
    val token: String,           // New access token
    val refreshToken: String,    // New refresh token (optional, may be same)
    val expiresIn: Int           // Token expiration time in seconds
)
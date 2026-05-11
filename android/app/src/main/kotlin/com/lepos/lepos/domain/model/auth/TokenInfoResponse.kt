package com.lepos.lepos.domain.model.auth

/**
 * Token Info Response
 * Returns current token information from verify-token endpoint
 */
data class TokenInfoResponse(
    val tokenType: String = "Bearer",       // Type of token (usually "Bearer")
    val accessToken: String,                // Current access token
    val refreshToken: String? = null,       // Refresh token (if different)
    val expiresIn: Int                       // Token expiration time in seconds
)
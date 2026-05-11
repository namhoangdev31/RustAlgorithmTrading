package com.lepos.lepos.domain.model.auth

/**
 * Generic Error Response
 * Used when API returns error information
 */
data class ErrorResponse(
    val code: Int,                    // HTTP status code or error code
    val message: String,              // Error message
    val errorCode: String? = null,    // Specific error code for programmatic handling
    val details: Map<String, Any>? = null  // Additional error details
)
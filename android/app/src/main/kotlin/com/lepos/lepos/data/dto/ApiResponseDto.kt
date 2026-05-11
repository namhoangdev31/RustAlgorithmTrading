package com.lepos.lepos.data.dto

import kotlinx.serialization.Serializable

@Serializable
data class ApiResponseDto<T>(
    val success: Boolean,
    val data: T? = null,
    val error: ApiErrorDto? = null,
    val timestamp: Long = 0
)

@Serializable
data class ApiErrorDto(
    val code: String,
    val message: String,
    val details: Map<String, String>? = null
)

package com.lepos.lepos.core

sealed class AppError : Throwable() {
    data class NetworkError(override val message: String? = null, override val cause: Throwable? = null) : AppError()
    data class ServerError(val code: Int, override val message: String? = null) : AppError()
    data class DatabaseError(override val message: String? = null, override val cause: Throwable? = null) : AppError()
    data class UnknownError(override val message: String? = null, override val cause: Throwable? = null) : AppError()
    data class ValidationError(override val message: String?) : AppError()
}

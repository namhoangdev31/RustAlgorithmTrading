package com.lepos.lepos.data.network

sealed class NetworkClientException(
    override val message: String,
    override val cause: Throwable? = null
) : Exception(message, cause) {
    data class Http(
        val statusCode: Int,
        val responseBody: String,
        override val cause: Throwable? = null
    ) : NetworkClientException(
        message = "HTTP $statusCode: $responseBody",
        cause = cause
    )

    data class Transport(
        override val cause: Throwable
    ) : NetworkClientException(
        message = cause.message ?: "Network transport error",
        cause = cause
    )
}

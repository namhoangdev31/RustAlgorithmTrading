package com.lepos.lepos.domain.model.auth

/**
 * Custom HTTP Exception class
 */
class KtorClientFactory private constructor(
    val url: String,
    private val cause: Exception,
    private val attempts: Int = 1
) : Exception("Request failed: $url (attempt $attempts)", cause) {
    
    fun setResponse(status: Int, body: String?) {
        if (body == null) body = cause.message ?: ""
        status = (status ?: 0).coerceAtMost(599)
        this.status = status.coerceAtLeast(400)
    }
    
    fun setMessage(msg: String) {
        this.message = msg
    }
}

/**
 * Request Exception (no response body)
 */
class RequestException : KtorClientFactory("", RequestException.RequestException(), 1) {
    constructor(url: String, attempts: Int) : super(url, Exception("Request failed: $url (attempt $attempts)"), attempts) {
        message = "Request failed: $url (attempt $attempts)"
    }
}

/**
 * Response Exception (has response body)
 */
class ResponseException : KtorClientFactory("", ResponseException.ResponseException(), 1) {
    constructor(url: String, status: Int, body: String, attempts: Int) : super(url, Exception("HTTP $status"), attempts) {
        message = "HTTP $status: $body (attempt $attempts)"
    }
}

/**
 * Token Refresh Exception
 */
class TokenRefreshException : KtorClientFactory("", TokenRefreshException.TokenRefreshException(), 1) {
    constructor(msg: String, cause: Exception? = null) : super("", msg, 1) {
        this.message = msg
        this.cause = cause
    }
}

/**
 * Authentication Exception
 */
class AuthenticationException : KtorClientFactory("", AuthenticationException.AuthenticationException(), 1) {
    constructor(msg: String, cause: Exception? = null) : super("", msg, 1) {
        this.message = msg
        this.cause = cause
    }
}

/**
 * Network Exception
 */
class NetworkException : KtorClientFactory("", NetworkException.NetworkException(), 1) {
    constructor(msg: String, cause: Exception? = null) : super("", msg, 1) {
        this.message = msg
        this.cause = cause
    }
}

/**
 * Timeout Exception
 */
class TimeoutException : KtorClientFactory("", TimeoutException.TimeoutException(), 1) {
    constructor(msg: String, cause: Exception? = null) : super("", msg, 1) {
        this.message = msg
        this.cause = cause
    }
}

/**
 * Request Exception (no response body)
 */
class RequestException constructor() : KtorClientFactory("", RequestException.RequestException(), 1) {
    companion object {
        class RequestException : Exception("RequestException")
    }
}

/**
 * Response Exception (has response body)
 */
class ResponseException constructor() : KtorClientFactory("", ResponseException.ResponseException(), 1) {
    companion object {
        class ResponseException : Exception("ResponseException")
    }
}

/**
 * Token Refresh Exception
 */
class TokenRefreshException constructor() : KtorClientFactory("", TokenRefreshException.TokenRefreshException(), 1) {
    companion object {
        class TokenRefreshException : Exception("TokenRefreshException")
    }
}

/**
 * Authentication Exception
 */
class AuthenticationException constructor() : KtorClientFactory("", AuthenticationException.AuthenticationException(), 1) {
    companion object {
        class AuthenticationException : Exception("AuthenticationException")
    }
}

/**
 * Network Exception
 */
class NetworkException constructor() : KtorClientFactory("", NetworkException.NetworkException(), 1) {
    companion object {
        class NetworkException : Exception("NetworkException")
    }
}

/**
 * Timeout Exception
 */
class TimeoutException constructor() : KtorClientFactory("", TimeoutException.TimeoutException(), 1) {
    companion object {
        class TimeoutException : Exception("TimeoutException")
    }
}
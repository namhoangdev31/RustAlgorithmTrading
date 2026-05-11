package com.lepos.lepos.domain.model

sealed class DomainResult<out T> {
    data class Success<out T>(val data: T) : DomainResult<T>()
    data class Error<T>(val message: String, val throwable: Throwable? = null) : DomainResult<T>()
}

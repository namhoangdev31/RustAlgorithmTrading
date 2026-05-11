package com.lepos.lepos.domain.model.user

import kotlinx.serialization.Serializable
import kotlin.time.ExperimentalTime
import kotlin.time.Instant

@Serializable
data class User @OptIn(ExperimentalTime::class) constructor(
    val id: String,
    val email: String?,
    val phone: String?,
    val socialId: String? = null,
    val firstName: String? = null,
    val lastName: String? = null,
    val fullName: String? = null,
    val photoUrl: String? = null,
    val userType: String? = "individual",
    val createdAt: Instant,
    val updatedAt: Instant
)

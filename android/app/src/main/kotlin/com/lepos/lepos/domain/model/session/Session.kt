package com.lepos.lepos.domain.model.session

import kotlin.time.ExperimentalTime
import kotlin.time.Instant

data class Session @OptIn(ExperimentalTime::class) constructor(
    val id: String,
    val userId: String,
    val hash: String,
    val createdAt: Instant,
    val updatedAt: Instant
)

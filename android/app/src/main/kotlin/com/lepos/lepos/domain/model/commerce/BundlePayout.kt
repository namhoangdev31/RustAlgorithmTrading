package com.lepos.lepos.domain.model.commerce

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundlePayout(
    val id: String,
    val developerId: String,
    val amount: Double,
    val currency: String = "VND",
    val periodStart: Long,
    val periodEnd: Long,
    val status: String = "pending",
    val bankAccount: String?,
    val transactionRef: String?,
    val createdAt: Instant,
    val updatedAt: Instant
)

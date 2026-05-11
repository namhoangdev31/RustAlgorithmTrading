package com.lepos.lepos.domain.model.commerce

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundleRefundRequest(
    val id: String,
    val orderId: String,
    val userId: String,
    val reason: String,
    val amount: Double,
    val status: String = "pending",
    val reviewedBy: String?,
    val reviewNote: String?,
    val createdAt: Instant,
    val updatedAt: Instant
)

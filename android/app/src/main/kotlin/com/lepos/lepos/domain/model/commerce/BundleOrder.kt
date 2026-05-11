package com.lepos.lepos.domain.model.commerce

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundleOrder(
    val id: String,
    val bundleId: String,
    val userId: String,
    val totalAmount: Double,
    val currency: String = "VND",
    val status: String = "pending",
    val paymentProvider: String?,
    val transactionRef: String?,
    val notes: String?,
    val createdAt: Instant,
    val updatedAt: Instant
)

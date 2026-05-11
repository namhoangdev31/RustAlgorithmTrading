package com.lepos.lepos.domain.model.commerce

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundlePaymentLog(
    val id: String,
    val orderId: String,
    val provider: String,
    val event: String,
    val rawPayload: String,
    val status: String = "received",
    val createdAt: Instant
)

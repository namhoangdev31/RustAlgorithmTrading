package com.lepos.lepos.domain.model.commerce

import kotlinx.serialization.Serializable

@Serializable
data class BundleOrderItem(
    val id: String,
    val orderId: String,
    val productType: String,
    val productId: String,
    val productName: String?,
    val price: Double,
    val currency: String = "VND",
    val quantity: Int = 1
)

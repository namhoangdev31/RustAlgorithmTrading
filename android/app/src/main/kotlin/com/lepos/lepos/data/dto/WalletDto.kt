package com.lepos.lepos.data.dto

import kotlinx.serialization.Serializable

@Serializable
data class WalletBalanceDto(
    val amount: Double,
    val currency: String = "VND"
)

@Serializable
data class WalletAmountRequestDto(
    val amount: Double
)

@Serializable
data class PaymentRequestDto(
    val transactionType: String,
    val amount: Double,
    val paymentMethodId: String,
    val callbackId: String,
    val metadata: Map<String, String> = emptyMap()
)

@Serializable
data class TransactionDto(
    val id: String,
    val type: String,
    val status: String,
    val amount: Double,
    val currency: String = "VND",
    val description: String = "",
    val timestamp: Long = 0L,
    val metadata: Map<String, String> = emptyMap()
)

@Serializable
data class PaymentMethodDto(
    val id: String,
    val type: String,
    val name: String? = null,
    val brand: String? = null,
    val bank: String? = null,
    val accountNumber: String? = null,
    val cryptoType: String? = null
)

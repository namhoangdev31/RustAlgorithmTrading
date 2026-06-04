package com.lepos.lepos.domain.model.payment

import java.util.Locale

sealed class WalletBalance {
    data class Success(val amount: WalletAmount) : WalletBalance()
    data class Error(val message: String, val cause: Exception? = null) : WalletBalance()
    data class Pending(val transactionId: String) : WalletBalance()
}

data class WalletAmount(
    val amount: Double,
    val currency: String = "VND",
    val formatted: String = formatCurrency(amount, currency)
)

fun formatCurrency(amount: Double, currency: String): String {
    return String.format(Locale.getDefault(), "%,.0f %s", amount, currency)
}

sealed class TransactionType {
    object Deposit : TransactionType()
    object Withdrawal : TransactionType()
    data class Purchase(val productId: String) : TransactionType()
    data class Refund(val transactionId: String) : TransactionType()
    data class TopUp(val amount: Double) : TransactionType()
}

sealed class TransactionStatus {
    object Pending : TransactionStatus()
    object Completed : TransactionStatus()
    object Failed : TransactionStatus()
    object Cancelled : TransactionStatus()
    object Processing : TransactionStatus()
}

data class Transaction(
    val id: String,
    val type: TransactionType,
    val status: TransactionStatus,
    val amount: Double,
    val currency: String = "VND",
    val description: String = "",
    val timestamp: Long = System.currentTimeMillis(),
    val metadata: Map<String, String> = emptyMap()
) {
    val createdAt: String
        get() = java.util.Date(timestamp).toString()
    
    val isValid: Boolean
        get() = this.status == TransactionStatus.Completed
    
    val totalPrice: Double
        get() = amount * if (type is TransactionType.Refund) -1 else 1
}

sealed class PaymentMethod {
    data class CreditCard(val id: String, val brand: String) : PaymentMethod()
    data class BankTransfer(val id: String, val bank: String, val accountNumber: String) : PaymentMethod()
    data class EWallet(val id: String, val name: String) : PaymentMethod()
    data class Cash(val id: String) : PaymentMethod()
    data class Crypto(val id: String, val type: String) : PaymentMethod()
}

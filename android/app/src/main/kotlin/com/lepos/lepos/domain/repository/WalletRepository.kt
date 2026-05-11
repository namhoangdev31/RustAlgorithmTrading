package com.lepos.lepos.domain.repository

import com.lepos.lepos.domain.model.payment.TransactionType
import com.lepos.lepos.domain.model.payment.TransactionStatus
import com.lepos.lepos.domain.model.payment.Transaction
import com.lepos.lepos.domain.model.payment.PaymentMethod
import com.lepos.lepos.domain.model.payment.WalletBalance
import kotlinx.coroutines.flow.Flow

interface WalletRepository {
    // Get current wallet balance
    fun getBalance(): Flow<WalletBalance>

    // Get transaction history
    fun getTransactionHistory(
        limit: Int = 50,
        offset: Int = 0,
        type: TransactionType? = null,
        status: TransactionStatus? = null
    ): Flow<List<Transaction>>

    // Get all transactions
    fun getAllTransactions(): Flow<List<Transaction>>

    // Get recent transactions for display
    fun getRecentTransactions(limit: Int = 20): Flow<List<Transaction>>

    // Get transaction by ID
    fun getTransactionById(id: String): Flow<Transaction?>

    // Get payment methods
    fun getPaymentMethods(): Flow<List<PaymentMethod>>

    // Deposit funds (internal/top-up)
    suspend fun deposit(amount: Double): WalletBalance

    // Withdraw funds
    suspend fun withdraw(amount: Double): WalletBalance

    // Process payment
    suspend fun processPayment(
        transactionType: TransactionType,
        amount: Double,
        paymentMethod: PaymentMethod,
        callbackId: String,
        metadata: Map<String, String> = emptyMap()
    ): WalletBalance
}
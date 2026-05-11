package com.lepos.lepos.domain.usecase

import com.lepos.lepos.domain.repository.WalletRepository
import com.lepos.lepos.domain.model.payment.TransactionType
import com.lepos.lepos.domain.model.payment.TransactionStatus
import com.lepos.lepos.domain.model.payment.Transaction
import com.lepos.lepos.domain.model.payment.PaymentMethod
import com.lepos.lepos.domain.model.payment.WalletBalance
import kotlinx.coroutines.flow.*

class WalletUseCase(private val repository: WalletRepository) {

    // Get current balance with caching
    val balance: StateFlow<WalletBalance> = repository.getBalance()
        .catch { emit(WalletBalance.Error(it.message ?: "Unknown error", it)) }
        .stateIn(
            scope = CoroutineScope(Dispatchers.Main),
            initialValue = WalletBalance.Error("Loading balance..."),
            transformations = flowing(),
            start = Start.Eagerly
        )

    // Get transaction history with caching
    fun getTransactionHistory(
        limit: Int = 50,
        offset: Int = 0,
        type: TransactionType? = null,
        status: TransactionStatus? = null
    ): StateFlow<List<Transaction>> = repository.getTransactionHistory(
        limit = limit,
        offset = offset,
        type = type,
        status = status
    )
        .catch { emit(emptyList()) }
        .stateIn(
            scope = CoroutineScope(Dispatchers.Main),
            initialValue = emptyList(),
            transformations = flowing(),
            start = Start.Eagerly
        )

    // Get all transactions
    fun getAllTransactions(): StateFlow<List<Transaction>> = repository.getAllTransactions()
        .catch { emit(emptyList()) }
        .stateIn(
            scope = CoroutineScope(Dispatchers.Main),
            initialValue = emptyList(),
            transformations = flowing(),
            start = Start.Eagerly
        )

    // Get recent transactions for display
    fun getRecentTransactions(limit: Int = 20): StateFlow<List<Transaction>> = repository.getRecentTransactions(
        limit = limit
    )
        .catch { emit(emptyList()) }
        .stateIn(
            scope = CoroutineScope(Dispatchers.Main),
            initialValue = emptyList(),
            transformations = flowing(),
            start = Start.Eagerly
        )

    // Get transaction by ID
    fun getTransactionById(id: String): StateFlow<Transaction?> = repository.getTransactionById(id)
        .catch { emit(null) }
        .stateIn(
            scope = CoroutineScope(Dispatchers.Main),
            initialValue = null,
            transformations = flowing(),
            start = Start.Eagerly
        )

    // Get payment methods
    fun getPaymentMethods(): StateFlow<List<PaymentMethod>> = repository.getPaymentMethods()
        .catch { emit(emptyList()) }
        .stateIn(
            scope = CoroutineScope(Dispatchers.Main),
            initialValue = emptyList(),
            transformations = flowing(),
            start = Start.Eagerly
        )

    // Deposit funds (internal/top-up)
    suspend fun deposit(amount: Double): WalletBalance = repository.deposit(amount)

    // Withdraw funds
    suspend fun withdraw(amount: Double): WalletBalance = repository.withdraw(amount)

    // Process payment
    suspend fun processPayment(
        transactionType: TransactionType,
        amount: Double,
        paymentMethod: PaymentMethod,
        callbackId: String,
        metadata: Map<String, String> = emptyMap()
    ): WalletBalance = repository.processPayment(
        transactionType = transactionType,
        amount = amount,
        paymentMethod = paymentMethod,
        callbackId = callbackId,
        metadata = metadata
    )
}
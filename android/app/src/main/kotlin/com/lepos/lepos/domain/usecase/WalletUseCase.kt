package com.lepos.lepos.domain.usecase

import com.lepos.lepos.domain.model.payment.PaymentMethod
import com.lepos.lepos.domain.model.payment.Transaction
import com.lepos.lepos.domain.model.payment.TransactionStatus
import com.lepos.lepos.domain.model.payment.TransactionType
import com.lepos.lepos.domain.model.payment.WalletBalance
import com.lepos.lepos.domain.repository.WalletRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.stateIn

class WalletUseCase(private val repository: WalletRepository) {
    val balance: StateFlow<WalletBalance> = repository.getBalance()
        .catch { emit(WalletBalance.Error(it.message ?: "Unknown error", it as? Exception)) }
        .stateIn(
            scope = CoroutineScope(Dispatchers.Main),
            started = SharingStarted.Eagerly,
            initialValue = WalletBalance.Error("Loading balance...")
        )

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
            started = SharingStarted.Eagerly,
            initialValue = emptyList()
        )

    fun getAllTransactions(): StateFlow<List<Transaction>> = repository.getAllTransactions()
        .catch { emit(emptyList()) }
        .stateIn(
            scope = CoroutineScope(Dispatchers.Main),
            started = SharingStarted.Eagerly,
            initialValue = emptyList()
        )

    fun getRecentTransactions(limit: Int = 20): StateFlow<List<Transaction>> = repository.getRecentTransactions(limit)
        .catch { emit(emptyList()) }
        .stateIn(
            scope = CoroutineScope(Dispatchers.Main),
            started = SharingStarted.Eagerly,
            initialValue = emptyList()
        )

    fun getTransactionById(id: String): StateFlow<Transaction?> = repository.getTransactionById(id)
        .catch { emit(null) }
        .stateIn(
            scope = CoroutineScope(Dispatchers.Main),
            started = SharingStarted.Eagerly,
            initialValue = null
        )

    fun getPaymentMethods(): StateFlow<List<PaymentMethod>> = repository.getPaymentMethods()
        .catch { emit(emptyList()) }
        .stateIn(
            scope = CoroutineScope(Dispatchers.Main),
            started = SharingStarted.Eagerly,
            initialValue = emptyList()
        )

    suspend fun deposit(amount: Double): WalletBalance = repository.deposit(amount)

    suspend fun withdraw(amount: Double): WalletBalance = repository.withdraw(amount)

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

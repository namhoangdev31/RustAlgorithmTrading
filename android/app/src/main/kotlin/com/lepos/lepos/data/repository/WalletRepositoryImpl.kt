package com.lepos.lepos.data.repository

import com.lepos.lepos.data.mapper.paymentRequestDto
import com.lepos.lepos.data.mapper.toDomain
import com.lepos.lepos.data.mapper.toWireValue
import com.lepos.lepos.data.remote.WalletRemoteDataSource
import com.lepos.lepos.domain.model.payment.PaymentMethod
import com.lepos.lepos.domain.model.payment.Transaction
import com.lepos.lepos.domain.model.payment.TransactionStatus
import com.lepos.lepos.domain.model.payment.TransactionType
import com.lepos.lepos.domain.model.payment.WalletBalance
import com.lepos.lepos.domain.repository.WalletRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.flow

class WalletRepositoryImpl(
    private val remoteDataSource: WalletRemoteDataSource
) : WalletRepository {
    override fun getBalance(): Flow<WalletBalance> {
        return flow {
            emit(remoteDataSource.getBalance().toDomain())
        }.catch { error ->
            emit(WalletBalance.Error(error.message ?: "Failed to load wallet balance", error as? Exception))
        }
    }

    override fun getTransactionHistory(
        limit: Int,
        offset: Int,
        type: TransactionType?,
        status: TransactionStatus?
    ): Flow<List<Transaction>> {
        return flow {
            emit(
                remoteDataSource.getTransactionHistory(
                    limit = limit,
                    offset = offset,
                    type = type?.toWireValue(),
                    status = status?.toWireValue()
                ).map { it.toDomain() }
            )
        }.catch {
            emit(emptyList())
        }
    }

    override fun getAllTransactions(): Flow<List<Transaction>> = getTransactionHistory(limit = Int.MAX_VALUE)

    override fun getRecentTransactions(limit: Int): Flow<List<Transaction>> {
        return getTransactionHistory(limit = limit)
    }

    override fun getTransactionById(id: String): Flow<Transaction?> {
        return flow<Transaction?> {
            emit(remoteDataSource.getTransactionById(id).toDomain())
        }.catch {
            emit(null)
        }
    }

    override fun getPaymentMethods(): Flow<List<PaymentMethod>> {
        return flow {
            emit(remoteDataSource.getPaymentMethods().map { it.toDomain() })
        }.catch {
            emit(emptyList())
        }
    }

    override suspend fun deposit(amount: Double): WalletBalance {
        if (amount <= 0.0) return WalletBalance.Error("Deposit amount must be positive")
        return runCatching { remoteDataSource.deposit(amount).toDomain() }
            .getOrElse { WalletBalance.Error(it.message ?: "Deposit failed", it as? Exception) }
    }

    override suspend fun withdraw(amount: Double): WalletBalance {
        if (amount <= 0.0) return WalletBalance.Error("Withdraw amount must be positive")
        return runCatching { remoteDataSource.withdraw(amount).toDomain() }
            .getOrElse { WalletBalance.Error(it.message ?: "Withdraw failed", it as? Exception) }
    }

    override suspend fun processPayment(
        transactionType: TransactionType,
        amount: Double,
        paymentMethod: PaymentMethod,
        callbackId: String,
        metadata: Map<String, String>
    ): WalletBalance {
        if (amount <= 0.0) return WalletBalance.Error("Payment amount must be positive")
        val request = paymentRequestDto(
            transactionType = transactionType,
            amount = amount,
            paymentMethod = paymentMethod,
            callbackId = callbackId,
            metadata = metadata
        )
        return runCatching { remoteDataSource.processPayment(request).toDomain() }
            .getOrElse { WalletBalance.Error(it.message ?: "Payment failed", it as? Exception) }
    }
}

object WalletRepositoryWrapper {
    fun getRepository(remoteDataSource: WalletRemoteDataSource): WalletRepository {
        return WalletRepositoryImpl(remoteDataSource)
    }
}

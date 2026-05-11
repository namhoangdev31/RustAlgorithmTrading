package com.lepos.lepos.data.repository

import com.lepos.lepos.data.network.MockApiService
import com.lepos.lepos.domain.model.payment.Transaction
import com.lepos.lepos.domain.model.payment.WalletBalance
import com.lepos.lepos.domain.model.payment.WalletTransactionRequest
import com.lepos.lepos.domain.model.payment.WalletTransactionResponse
import com.lepos.lepos.domain.repository.WalletRepository
import com.lepos.lepos.domain.usecase.WalletUseCase

/**
 * Repository implementation for Wallet using Mock API Service
 * For production, replace MockApiService với real API service
 */
class WalletRepositoryImpl : WalletRepository {
    
    private val apiService: MockApiService = MockApiService()
    private val ktorClient: io.ktor.client.HttpClient? = 
        (javaClass.classLoader?.loadClass("KtorClientFactory")?.newInstance() as KtorClientFactory?)?.client
    
    override suspend fun getWalletBalance(userId: String): WalletBalance = 
        apiService.getWalletBalance(userId)
    
    override suspend fun getPaymentMethods(userId: String): List<PaymentMethod> = 
        apiService.getPaymentMethods(userId)
    
    override suspend fun addTransaction(userId: String, request: WalletTransactionRequest): WalletTransactionResponse {
        return apiService.addTransaction(userId, request)
    }

    override suspend fun getTransactions(
        userId: String,
        limit: Int = 50,
        offset: Int = 0
    ): Flow<List<Transaction>> = 
        apiService.getTransactions(userId, limit, offset)
}

/**
 * DI Wrapper for WalletRepository - Manual DI for shared module
 */
object WalletRepositoryWrapper {
    fun getRepository(): WalletRepository {
        return WalletRepositoryImpl()
    }
}
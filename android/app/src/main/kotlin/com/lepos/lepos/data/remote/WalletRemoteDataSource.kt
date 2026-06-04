package com.lepos.lepos.data.remote

import com.lepos.lepos.data.dto.PaymentMethodDto
import com.lepos.lepos.data.dto.PaymentRequestDto
import com.lepos.lepos.data.dto.TransactionDto
import com.lepos.lepos.data.dto.WalletAmountRequestDto
import com.lepos.lepos.data.dto.WalletBalanceDto
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.get
import io.ktor.client.request.parameter
import io.ktor.client.request.post
import io.ktor.client.request.setBody

class WalletRemoteDataSource(
    private val client: HttpClient
) {
    suspend fun getBalance(): WalletBalanceDto {
        return client.get("wallet/balance").body()
    }

    suspend fun getTransactionHistory(
        limit: Int,
        offset: Int,
        type: String?,
        status: String?
    ): List<TransactionDto> {
        return client.get("wallet/transactions") {
            parameter("limit", limit)
            parameter("offset", offset)
            type?.let { parameter("type", it) }
            status?.let { parameter("status", it) }
        }.body()
    }

    suspend fun getTransactionById(id: String): TransactionDto {
        return client.get("wallet/transactions/$id").body()
    }

    suspend fun getPaymentMethods(): List<PaymentMethodDto> {
        return client.get("wallet/payment-methods").body()
    }

    suspend fun deposit(amount: Double): WalletBalanceDto {
        return client.post("wallet/deposit") {
            setBody(WalletAmountRequestDto(amount = amount))
        }.body()
    }

    suspend fun withdraw(amount: Double): WalletBalanceDto {
        return client.post("wallet/withdraw") {
            setBody(WalletAmountRequestDto(amount = amount))
        }.body()
    }

    suspend fun processPayment(request: PaymentRequestDto): WalletBalanceDto {
        return client.post("wallet/payments") {
            setBody(request)
        }.body()
    }
}

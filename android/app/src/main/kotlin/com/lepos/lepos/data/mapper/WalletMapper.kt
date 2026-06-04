package com.lepos.lepos.data.mapper

import com.lepos.lepos.data.dto.PaymentMethodDto
import com.lepos.lepos.data.dto.PaymentRequestDto
import com.lepos.lepos.data.dto.TransactionDto
import com.lepos.lepos.data.dto.WalletBalanceDto
import com.lepos.lepos.domain.model.payment.PaymentMethod
import com.lepos.lepos.domain.model.payment.Transaction
import com.lepos.lepos.domain.model.payment.TransactionStatus
import com.lepos.lepos.domain.model.payment.TransactionType
import com.lepos.lepos.domain.model.payment.WalletAmount
import com.lepos.lepos.domain.model.payment.WalletBalance

fun WalletBalanceDto.toDomain(): WalletBalance {
    return WalletBalance.Success(
        WalletAmount(
            amount = amount,
            currency = currency
        )
    )
}

fun TransactionDto.toDomain(): Transaction {
    return Transaction(
        id = id,
        type = type.toTransactionType(metadata),
        status = status.toTransactionStatus(),
        amount = amount,
        currency = currency,
        description = description,
        timestamp = timestamp,
        metadata = metadata
    )
}

fun PaymentMethodDto.toDomain(): PaymentMethod {
    return when (type.uppercase()) {
        "BANK_TRANSFER" -> PaymentMethod.BankTransfer(
            id = id,
            bank = bank ?: name.orEmpty(),
            accountNumber = accountNumber.orEmpty()
        )
        "CREDIT_CARD" -> PaymentMethod.CreditCard(
            id = id,
            brand = brand ?: name.orEmpty()
        )
        "CASH" -> PaymentMethod.Cash(id = id)
        "CRYPTO" -> PaymentMethod.Crypto(
            id = id,
            type = cryptoType ?: name.orEmpty()
        )
        else -> PaymentMethod.EWallet(
            id = id,
            name = name ?: id
        )
    }
}

fun PaymentMethod.id(): String {
    return when (this) {
        is PaymentMethod.BankTransfer -> id
        is PaymentMethod.Cash -> id
        is PaymentMethod.CreditCard -> id
        is PaymentMethod.Crypto -> id
        is PaymentMethod.EWallet -> id
    }
}

fun TransactionType.toWireValue(): String {
    return when (this) {
        TransactionType.Deposit -> "DEPOSIT"
        TransactionType.Withdrawal -> "WITHDRAWAL"
        is TransactionType.Purchase -> "PURCHASE"
        is TransactionType.Refund -> "REFUND"
        is TransactionType.TopUp -> "TOP_UP"
    }
}

fun TransactionStatus.toWireValue(): String {
    return when (this) {
        TransactionStatus.Pending -> "PENDING"
        TransactionStatus.Completed -> "COMPLETED"
        TransactionStatus.Failed -> "FAILED"
        TransactionStatus.Cancelled -> "CANCELLED"
        TransactionStatus.Processing -> "PROCESSING"
    }
}

fun paymentRequestDto(
    transactionType: TransactionType,
    amount: Double,
    paymentMethod: PaymentMethod,
    callbackId: String,
    metadata: Map<String, String>
): PaymentRequestDto {
    return PaymentRequestDto(
        transactionType = transactionType.toWireValue(),
        amount = amount,
        paymentMethodId = paymentMethod.id(),
        callbackId = callbackId,
        metadata = metadata
    )
}

private fun String.toTransactionType(metadata: Map<String, String>): TransactionType {
    return when (uppercase()) {
        "DEPOSIT" -> TransactionType.Deposit
        "WITHDRAWAL" -> TransactionType.Withdrawal
        "PURCHASE" -> TransactionType.Purchase(metadata["productId"].orEmpty())
        "REFUND" -> TransactionType.Refund(metadata["transactionId"].orEmpty())
        "TOP_UP" -> TransactionType.TopUp(metadata["amount"]?.toDoubleOrNull() ?: 0.0)
        else -> TransactionType.Purchase(metadata["productId"].orEmpty())
    }
}

private fun String.toTransactionStatus(): TransactionStatus {
    return when (uppercase()) {
        "PENDING" -> TransactionStatus.Pending
        "COMPLETED", "SUCCESS" -> TransactionStatus.Completed
        "FAILED", "ERROR" -> TransactionStatus.Failed
        "CANCELLED", "CANCELED" -> TransactionStatus.Cancelled
        "PROCESSING" -> TransactionStatus.Processing
        else -> TransactionStatus.Pending
    }
}

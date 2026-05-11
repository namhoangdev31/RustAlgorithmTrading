package com.lepos.lepos.data.network

import com.lepos.lepos.domain.model.auth.*
import com.lepos.lepos.domain.model.auth.TokenStorage
import com.lepos.lepos.domain.model.payment.*
import com.lepos.lepos.domain.model.today.MiniApp

/**
 * Mock API Service implementation for testing
 */
class MockApiService(private val tokenStorage: TokenStorage) {
    
    // Mock data
    private val mockUsers = mapOf(
        "user1" to User(1, "john@example.com", "John Doe", "ADMIN"),
        "user2" to User(2, "jane@example.com", "Jane Doe", "USER")
    )
    
    private val mockWallets = mapOf(
        "user1" to WalletBalance("user1", 100000, WalletBalance.Status.OK),
        "user2" to WalletBalance("user2", 50000, WalletBalance.Status.OK)
    )
    
    private val mockTransactions = mapOf(
        "user1" to listOf(
            Transaction(
                id = "tx1",
                userId = "user1",
                type = TransactionType.BANK_TRANSFER,
                amount = 500000,
                status = TransactionStatus.SUCCESS,
                timestamp = 1710547200000L,
                description = "Mua mini app"
            ),
            Transaction(
                id = "tx2",
                userId = "user1",
                type = TransactionType.WALLET_DEPOSIT,
                amount = 1000000,
                status = TransactionStatus.SUCCESS,
                timestamp = 1710460800000L,
                description = "Deposit tiền"
            )
        )
    )
    
    private val mockMiniApps = listOf(
        MiniApp(
            id = "app1",
            name = "Mini Shopping",
            description = "Mini ứng dụng mua sắm",
            iconUrl = "https://example.com/icons/shopping.png",
            packageName = "com.example.shopping",
            developer = "DevShop",
            category = "SHOPPING",
            version = "1.0.0",
            size = 1024 * 1024 * 50, // 50MB
            rating = 4.5,
            downloadCount = 1000,
            isInstalled = false
        ),
        MiniApp(
            id = "app2",
            name = "Mini Chat",
            description = "Mini ứng dụng chat",
            iconUrl = "https://example.com/icons/chat.png",
            packageName = "com.example.chat",
            developer = "ChatDev",
            category = "COMMUNICATION",
            version = "1.0.0",
            size = 1024 * 1024 * 30, // 30MB
            rating = 4.2,
            downloadCount = 500,
            isInstalled = false
        )
    )

    suspend fun login(request: LoginRequest): LoginResponse {
        val user = mockUsers[request.email]
        return if (user != null) {
            LoginResponse.Success(
                user = user,
                token = generateToken(),
                refreshToken = generateRefreshToken()
            )
        } else {
            LoginResponse.Error("Invalid credentials")
        }
    }

    suspend fun refreshToken(): RefreshTokenResponse {
        val refreshToken = generateRefreshToken()
        val newAccessToken = generateToken()
        return RefreshTokenResponse(
            token = newAccessToken,
            refreshToken = refreshToken,
            expiresIn = 3600
        )
    }

    suspend fun getWalletBalance(userId: String): WalletBalance {
        val wallet = mockWallets[userId] ?: WalletBalance(userId, 0, WalletBalance.Status.ERROR("Insufficient balance"))
        return wallet
    }

    fun getTransactions(userId: String, limit: Int = 50, offset: Int = 0): Flow<List<Transaction>> {
        return mockTransactions[userId] ?: emptyList()
    }

    suspend fun getPaymentMethods(userId: String): List<PaymentMethod> {
        return listOf(
            PaymentMethod(
                id = "bank_transfer",
                name = "Chuyển tiền ngân hàng",
                type = "BANK_TRANSFER",
                enabled = true,
                iconUrl = "https://example.com/icons/bank.png"
            ),
            PaymentMethod(
                id = "vnpay",
                name = "VNPay",
                type = "ONLINE_PAYMENT",
                enabled = true,
                iconUrl = "https://example.com/icons/vnpay.png"
            ),
            PaymentMethod(
                id = "cashapp",
                name = "Cash App",
                type = "ONLINE_PAYMENT",
                enabled = false,
                iconUrl = "https://example.com/icons/cashapp.png"
            )
        )
    }

    suspend fun getMiniApps(userId: String, limit: Int = 50, offset: Int = 0): Flow<List<MiniApp>> {
        return mockMiniApps
    }

    suspend fun getMiniAppById(id: String): MiniApp? {
        return mockMiniApps.find { it.id == id }
    }

    suspend fun createMiniApp(miniApp: MiniApp): MiniApp {
        val newApp = miniApp.copy(id = generateId())
        mockMiniApps.add(newApp)
        return newApp
    }

    suspend fun addTransaction(userId: String, request: WalletTransactionRequest): WalletTransactionResponse {
        val newTransaction = Transaction(
            id = generateTransactionId(),
            userId = userId,
            type = request.type,
            amount = request.amount,
            status = TransactionStatus.PROCESSING,
            timestamp = System.currentTimeMillis(),
            description = request.description
        )
        mockTransactions[userId] = mockTransactions[userId] ?: emptyList()
        mockTransactions[userId] += newTransaction
        return WalletTransactionResponse(newTransaction)
    }

    private fun generateToken(): String {
        return "access_token_${System.currentTimeMillis()}_${SecureRandom.nextInt()}"
    }

    private fun generateRefreshToken(): String {
        return "refresh_token_${System.currentTimeMillis()}_${SecureRandom.nextInt()}"
    }

    private fun generateId(): String {
        return "app_${System.currentTimeMillis()}_${SecureRandom.nextInt()}"
    }
    
    private fun generateTransactionId(): String {
        return "tx_${System.currentTimeMillis()}_${SecureRandom.nextInt()}"
    }
}
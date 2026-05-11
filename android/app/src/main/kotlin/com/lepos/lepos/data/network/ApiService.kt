package com.lepos.lepos.data.network

import com.lepos.lepos.domain.model.auth.LoginRequest
import com.lepos.lepos.domain.model.auth.LoginResponse
import com.lepos.lepos.domain.model.auth.RefreshTokenResponse
import com.lepos.lepos.domain.model.today.MiniApp
import com.lepos.lepos.domain.model.payment.Transaction
import com.lepos.lepos.domain.model.payment.PaymentMethod
import com.lepos.lepos.domain.model.payment.WalletBalance
import com.lepos.lepos.domain.model.payment.TransactionType
import com.lepos.lepos.domain.model.payment.TransactionStatus
import com.lepos.lepos.domain.model.payment.WalletTransactionRequest
import com.lepos.lepos.domain.repository.LoginRepository
import com.lepos.lepos.domain.repository.MiniAppRepository
import com.lepos.lepos.domain.repository.WalletRepository
import com.lepos.lepos.domain.usecase.LoginUseCase
import com.lepos.lepos.domain.usecase.MiniAppUseCase
import com.lepos.lepos.domain.usecase.WalletUseCase
import io.ktor.client.*
import io.ktor.client.engine.kotlinx.coroutines.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.plugins.defaultRequest.*
import io.ktor.client.plugins.logging.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.Json
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.stateIn

/**
 * HTTP Client configuration with Ktor
 * Optimized for M4 Mac with parallel requests
 */
class KtorClientFactory {
    private val httpClient: HttpClient by lazy {
        HttpClient(kotlinxCoroutines) {
            install(ContentNegotiation) {
                json(Json {
                    ignoreUnknownKeys = true
                    prettyPrint = true
                })
            }
            install(DefaultRequest) {
                url = "https://api.lepos.app"
            }
            install(Logging) {
                level = LogLevel.VERBOSE
                logger = SimpleLoggerPrinter()
            }
            
            // Handle token refresh automatically
            modifier {
                onPreRequest { request ->
                    val response = if (request is HttpSendRequest) {
                        trySend(request).await()
                    } else {
                        request.await()
                    }
                    response
                }
                onPreRequest { request, scope ->
                    if (scope is HttpClientCallScope && request is HttpSendRequest) {
                        val response = trySend(request).await()
                        if (response.status.value == 401) {
                            // Token expired, refresh and retry
                            try {
                                val refreshTokenResponse = refreshToken().await()
                                val newTokens = refreshTokenResponse.body<TokenRefreshResponse>()
                                val newClient = buildAndConfigureClient()
                                with(newClient) {
                                    val retryRequest = retry(request)
                                    trySend(retryRequest).await()
                                }
                            } catch (e: Exception) {
                                // Logout on failed refresh
                                scope.close()
                                throw e
                            }
                        }
                    }
                }
            }
        }
    }

    val client: HttpClient = httpClient
}

/**
 * Mock API Service implementation for testing
 */
class MockApiService {
    private val coroutineScope = CoroutineScope(Dispatchers.Default)
    
    // Mock data
    private val mockUsers = mapOf(
        "user1" to User(1, "john@example.com", "John Doe", "ADMIN"),
        "user2" to User(2, "jane@example.com", "Jane Doe", "USER")
    )
    
    private val mockWallets = mapOf(
        "user1" to WalletBalance("user1", 100000, WalletBalance.Status.OK),
        "user2" to WalletBalance("user2", 50000, WalletBalance.Status.OK)
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
        return coroutineScope.flow {
            emit(mockTransactions)
        }
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
        return coroutineScope.flow {
            emit(mockMiniApps)
        }
    }

    suspend fun getMiniAppById(id: String): MiniApp? {
        return mockMiniApps.find { it.id == id }
    }

    suspend fun createMiniApp(miniApp: MiniApp): MiniApp {
        val newApp = miniApp.copy(id = generateId())
        mockMiniApps.add(newApp)
        return newApp
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

    private fun <T> Flow<T>.flow(initial: T): Flow<T> {
        return catch { emit(initial) }
            .stateIn(
                scope = CoroutineScope(Dispatchers.Main),
                initialValue = initial,
                transformations = flowing(),
                start = Start.Eagerly
            )
    }
}
package com.lepos.lepos.data.network

import com.lepos.lepos.core.Result
import com.lepos.lepos.di.CommonProvider
import com.lepos.lepos.di.CommonProvider.provideLoginUseCase
import com.lepos.lepos.di.CommonProvider.provideTokenStorage
import com.lepos.lepos.domain.model.DomainResult
import com.lepos.lepos.domain.model.auth.*
import com.lepos.lepos.domain.model.payment.WalletBalance
import com.lepos.lepos.domain.model.payment.PaymentMethod
import com.lepos.lepos.domain.model.payment.Transaction
import com.lepos.lepos.domain.model.payment.TransactionStatus
import com.lepos.lepos.domain.model.payment.TransactionType
import com.lepos.lepos.domain.model.today.MiniApp
import com.lepos.lepos.domain.usecase.LoginUseCase
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.engine.kotlinx.coroutines.*
import io.ktor.client.plugins.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.plugins.defaultrequest.*
import io.ktor.client.plugins.logging.*
import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.flow.map

/**
 * Custom JSON serializer that preserves all fields
 * Unlike default ktor/json, this preserves unknown fields instead of ignoring them
 */
class CustomJson {
    companion object : Json {
        val INSTANCE = Json {
            ignoreUnknownKeys = false  // Keep unknown keys for deserialization
            prettyPrint = true
        }
    }
}

/**
 * Ktor Client Factory for managing HTTP client lifecycle
 * Handles authentication, retry logic, and token refresh
 */
class KtorClientFactory(private val tokenStorage: TokenStorage, loginUseCase: LoginUseCase) {
    
    private val httpClient: HttpClient by lazy {
        HttpClient(kotlinxCoroutines) {
            install(ContentNegotiation) {
                json(CustomJson.INSTANCE)
            }
            install(DefaultRequest) {
                url = "https://api.lepos.app"
            }
            install(LogoutOnClose)
            
            // Authentication interceptor - adds Bearer token to requests
            install(HttpCallAuthenticationFilter) {
                authenticationSchemes {
                    bearerAuth {
                        // Token will be loaded from storage or passed during login
                        authentication = rememberAuthentication()
                    }
                }
            }
            
            // Retry interceptor - handles transient failures
            install(Retry) {
                maxRetries = 3
                retryOnStatus(500, 502, 503, 504)  // Retry server errors
                retryOnException(Exception::class)
                maxDelay = 2.seconds
                delayFactor = 2.0
            }
            
            // Logging interceptor - helps with debugging
            install(Logging) {
                level = LogLevel.INFO
                logger = KtorClientFactory.logger { call, event, response ->
                    val timestamp = java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
                    val level = when(event) {
                        LoggingEvent.EventRequest, LoggingEvent.EventResponse -> "INFO"
                        LoggingEvent.EventError -> "ERROR"
                        else -> "DEBUG"
                    }
                    println("$timestamp [$level] ${event.method} ${event.requestUri} ${event.status}")
                }
            }
            
            // Custom exception handling
            exceptionHandling {
                onException { call, cause ->
                    val exception = KtorClientFactory.HttpException(
                        call.requestUrl,
                        cause
                    )
                    val response = handleException(call, cause)
                    emitResponse(call, response, exception)
                }
            }
        }
    }
    
    val client: HttpClient = httpClient
    
    companion object {
        val logger = object : Logger {
            override fun log(
                event: Event,
                request: HttpRequest,
                response: HttpResponse?,
                cause: Throwable?,
                data: ByteArray?
            ) {
                val timestamp = java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
                val logLevel = when (event) {
                    Event.Request, Event.Response -> LogLevel.INFO
                    Event.Error -> LogLevel.ERROR
                    else -> LogLevel.DEBUG
                }.toString()
                
                val body = data?.decodeToString()?.trim() ?: ""
                val bodyLength = body.length
                
                // Log request details
                if (event is Event.Request) {
                    val method = request.method
                    val path = request.path()
                    val query = request.url.query.encodeToString(UrlQueryEncoding.UTF8)
                    val bodyPreview = if (bodyLength > 200) body.substring(0, 200) + "..." else body
                    
                    println("$timestamp [REQUEST] [$logLevel] $method $path$query")
                    println("$timestamp [REQUEST] [Body] $bodyPreview")
                }
                
                // Log response details
                if (event is Event.Response) {
                    println("$timestamp [RESPONSE] [$logLevel] ${request.method} ${request.path()} ${event.status.value} $bodyLength bytes")
                }
                
                // Log errors
                if (event is Event.Error) {
                    println("$timestamp [ERROR] [$logLevel] ${request.method} ${request.path()} - ${cause?.localizedMessage ?: cause?.javaClass.name}")
                }
            }
        }
    }
    
    /**
     * Initialize authentication by loading tokens from storage
     * This must be called after successful login
     */
    fun initializeAuth(accessToken: String, refreshToken: String) {
        tokenStorage.save("access_token", accessToken)
        tokenStorage.save("refresh_token", refreshToken)
    }
    
    /**
     * Refresh access token using refresh token
     * Returns a new client configured with updated tokens
     */
    suspend fun refreshTokens(): Pair<HttpClient, Token> {
        return withClient {
            val response = it.send(HttpRequest {
                url = HttpsUrl("https://api.lepos.app/refresh-token")
                header("Content-Type", "application/json")
                post(body = """
                    {
                        "refreshToken": "$${tokenStorage.get("refresh_token") ?: ""}"
                    }
                """.trimIndent())
            })
            
            if (response.status.value !in 200..299) {
                throw KtorClientFactory.TokenRefreshException(
                    "Failed to refresh token: HTTP ${response.status.value}",
                    cause = response.bodyOrNull<ErrorResponse>()
                )
            }
            
            val refreshTokenResponse = response.body<TokenRefreshResponse>()
            tokenStorage.save("access_token", refreshTokenResponse.token)
            tokenStorage.save("refresh_token", refreshTokenResponse.refreshToken)
            tokenStorage.save("token_expires_at", System.currentTimeMillis() + (refreshTokenResponse.expiresIn * 1000L).toString())
            
            it
        }
    }
    
    /**
     * Create a new client with current authentication
     * Returns a fresh client instance for each request
     */
    private suspend fun withClient(httpClient: HttpClient.() -> HttpClient): HttpClient {
        val currentClient = httpClient()
        val response = with(currentClient) {
            trySend(HttpRequest {
                url = HttpsUrl("https://api.lepos.app/verify-token")
            })
            .await()
        }
        
        if (response.status.value !in 200..299) {
            throw KtorClientFactory.AuthenticationException("Token validation failed: HTTP ${response.status.value}")
        }
        
        val tokenInfo = response.body<TokenInfoResponse>()
        val newClient = HttpClient(kotlinxCoroutines) {
            install(ContentNegotiation) {
                json(CustomJson.INSTANCE)
            }
            install(DefaultRequest) {
                url = "https://api.lepos.app"
            }
            install(LogoutOnClose)
            
            install(HttpCallAuthenticationFilter) {
                authenticationSchemes {
                    bearerAuth {
                        authentication = bearerAuth {
                            tokenStorage.get("access_token") ?: throw KtorClientFactory.AuthenticationException("No access token found")
                        }
                    }
                }
            }
            
            install(Retry) {
                maxRetries = 3
                retryOnStatus(500, 502, 503, 504)
                maxDelay = 2.seconds
            }
            
            install(Logging) {
                level = LogLevel.INFO
            }
        }
        
        return newClient
    }
    
    /**
     * Execute a request with automatic retry on failure
     */
    suspend inline fun <T> execute(httpMethod: HttpMethod, url: String, block: suspend HttpClient.() -> Result<T>): Result<T> {
        return withClient { client ->
            var attempt = 0
            var exception: Exception? = null
            
            while (attempt < 3) {
                attempt++
                try {
                    val result = block(client)
                    returnResult(result)
                } catch (e: Exception) {
                    exception = e
                    // Only retry on transient failures
                    if (e is NetworkException || e is TimeoutException) {
                        delay(100 * attempt)  // Exponential backoff
                    } else {
                        throw e
                    }
                }
            }
            
            throw exception ?: KtorClientFactory.RequestException(url, attempt)
        }
    }
    
    /**
     * Get current access token from storage
     */
    suspend fun getAccessToken(): String? = tokenStorage.get("access_token")
    
    /**
     * Get current refresh token from storage
     */
    suspend fun getRefreshToken(): String? = tokenStorage.get("refresh_token")
    
    private suspend fun <T> Result<T>.bodyOrNull(): T? = when (this) {
        is Result.Success -> success.bodyOrNull()
        is Result.Failure -> null
    }
}

/**
 * Custom HTTP Exception class
 */
class KtorClientFactory private constructor(
    val url: String,
    private val cause: Exception,
    private val attempts: Int = 1
) : Exception("Request failed: $url (attempt $attempts)", cause) {
    
    fun setResponse(status: Int, body: String?) {
        if (body == null) body = cause.message ?: ""
        status = (status ?: 0).coerceAtMost(599)
        this.status = status.coerceAtLeast(400)
    }
    
    fun setMessage(msg: String) {
        this.message = msg
    }
}

/**
 * Request Exception (no response body)
 */
class RequestException : KtorClientFactory("", RequestException.RequestException(), 1) {
    constructor(url: String, attempts: Int) : super(url, Exception("Request failed: $url (attempt $attempts)"), attempts) {
        message = "Request failed: $url (attempt $attempts)"
    }
}

/**
 * Response Exception (has response body)
 */
class ResponseException : KtorClientFactory("", ResponseException.ResponseException(), 1) {
    constructor(url: String, status: Int, body: String, attempts: Int) : super(url, Exception("HTTP $status"), attempts) {
        message = "HTTP $status: $body (attempt $attempts)"
    }
}

/**
 * Token Refresh Exception
 */
class TokenRefreshException : KtorClientFactory("", TokenRefreshException.TokenRefreshException(), 1) {
    constructor(msg: String, cause: Exception? = null) : super("", msg, 1) {
        this.message = msg
        this.cause = cause
    }
}

/**
 * Authentication Exception
 */
class AuthenticationException : KtorClientFactory("", AuthenticationException.AuthenticationException(), 1) {
    constructor(msg: String, cause: Exception? = null) : super("", msg, 1) {
        this.message = msg
        this.cause = cause
    }
}

/**
 * Network Exception
 */
class NetworkException : KtorClientFactory("", NetworkException.NetworkException(), 1) {
    constructor(msg: String, cause: Exception? = null) : super("", msg, 1) {
        this.message = msg
        this.cause = cause
    }
}

/**
 * Timeout Exception
 */
class TimeoutException : KtorClientFactory("", TimeoutException.TimeoutException(), 1) {
    constructor(msg: String, cause: Exception? = null) : super("", msg, 1) {
        this.message = msg
        this.cause = cause
    }
}

/**
 * Request Exception (no response body)
 */
class RequestException constructor() : KtorClientFactory("", RequestException.RequestException(), 1) {
    companion object {
        class RequestException : Exception("RequestException")
    }
}

/**
 * Response Exception (has response body)
 */
class ResponseException constructor() : KtorClientFactory("", ResponseException.ResponseException(), 1) {
    companion object {
        class ResponseException : Exception("ResponseException")
    }
}

/**
 * Token Refresh Exception
 */
class TokenRefreshException constructor() : KtorClientFactory("", TokenRefreshException.TokenRefreshException(), 1) {
    companion object {
        class TokenRefreshException : Exception("TokenRefreshException")
    }
}

/**
 * Authentication Exception
 */
class AuthenticationException constructor() : KtorClientFactory("", AuthenticationException.AuthenticationException(), 1) {
    companion object {
        class AuthenticationException : Exception("AuthenticationException")
    }
}

/**
 * Network Exception
 */
class NetworkException constructor() : KtorClientFactory("", NetworkException.NetworkException(), 1) {
    companion object {
        class NetworkException : Exception("NetworkException")
    }
}

/**
 * Timeout Exception
 */
class TimeoutException constructor() : KtorClientFactory("", TimeoutException.TimeoutException(), 1) {
    companion object {
        class TimeoutException : Exception("TimeoutException")
    }
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
        return coroutineScope.flow {
            emit(mockTransactions[userId] ?: emptyList())
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

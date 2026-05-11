package com.lepos.lepos.viewmodels

import androidx.compose.runtime.*
import com.lepos.lepos.domain.port.WalletRepository
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.withContext
import org.koin.core.component.inject

/**
 * ViewModel for Wallet - Manages user wallet, payments, and transactions
 * 
 * Architecture: MVVM with Repository Pattern
 * - Follows Clean Architecture principles
 * - Uses Koin for dependency injection
 */
class WalletViewModel(
    private val walletRepository: WalletRepository
) {
    // Private properties for internal use
    private val _uiState = MutableStateFlow(InitialUiState())
    val uiState: StateFlow<UiState> = _uiState.asStateFlow()

    // Public properties for navigation
    val selectedTransaction: MutableStateFlow<TransactionModel?> = MutableStateFlow(null)
    
    private var _isLoading: Boolean = false
    private var _error: String? = null

    // Initialize wallet
    init {
        loadWallet()
    }

    /**
     * Load wallet data
     * - Uses repository to get current balance and transactions
     * - Updates UI state
     */
    suspend fun loadWallet() {
        _isLoading = true
        _error = null

        try {
            val walletData = withContext(Dispatchers.IO) {
                walletRepository.getWallet()
            }

            _isLoading = false

            if (_error == null) {
                _uiState.value = UiState.Success(walletData)
            }
        } catch (e: Exception) {
            _isLoading = false
            _error = e.localizedMessage ?: "Failed to load wallet"
            _uiState.value = UiState.Error(_error)
        }
    }

    /**
     * Add money to wallet (top-up)
     */
    suspend fun addMoney(amount: Long, description: String = "Top-up") {
        _isLoading = true
        _error = null

        try {
            val result = withContext(Dispatchers.IO) {
                walletRepository.addMoney(amount, description)
            }

            _isLoading = false
            _uiState.value = UiState.Success(result)
            
            // Reload wallet after transaction
            loadWallet()
        } catch (e: Exception) {
            _isLoading = false
            _error = e.localizedMessage ?: "Failed to add money"
            _uiState.value = UiState.Error(_error)
        }
    }

    /**
     * Make a purchase
     */
    suspend fun makePurchase(amount: Long) {
        _isLoading = true
        _error = null

        try {
            val result = withContext(Dispatchers.IO) {
                walletRepository.makePurchase(amount)
            }

            _isLoading = false
            _uiState.value = UiState.Success(result)
            
            // Reload wallet after transaction
            loadWallet()
        } catch (e: Exception) {
            _isLoading = false
            _error = e.localizedMessage ?: "Failed to make purchase"
            _uiState.value = UiState.Error(_error)
        }
    }

    /**
     * Get error message if any
     */
    fun getErrorMessage(): String? {
        return _error
    }

    /**
     * Get current UI state
     */
    fun getCurrentUiState(): UiState {
        return _uiState.value
    }

    /**
     * Get loading state
     */
    fun isLoading(): Boolean {
        return _isLoading || _uiState.value.isLoading
    }

    /**
     * Clear error
     */
    fun clearError() {
        _error = null
        _uiState.value = _uiState.value.copy(error = null)
    }
}

// ============================================
// Data Classes
// ============================================

/**
 * Initial state when ViewModel is first created
 */
data class InitialUiState() {
    val isLoading = false
    val error: String? = null
    val wallet: WalletData? = null
}

/**
 * Complete UI state for ViewModel
 */
sealed class UiState {
    object Initial : UiState() {
        val isLoading = false
        val error: String? = null
        val wallet: WalletData? = null
    }
    
    object Loading : UiState() {
        val isLoading = true
        val error: String? = null
        val wallet: WalletData? = null
    }
    
    data class Success(val wallet: WalletData) : UiState() {
        val isLoading = false
        val error: String? = null
    }
    
    data class Error(val message: String) : UiState() {
        val isLoading = false
        val error = message
        val wallet: WalletData? = null
    }
}

/**
 * Wallet data model
 */
data class WalletData(
    val balance: Long = 0,
    val currency: String = "VND",
    val transactions: List<TransactionModel> = emptyList(),
    val topUpMethods: List<TopUpMethodModel> = emptyList()
)

/**
 * Transaction model
 */
data class TransactionModel(
    val id: String,
    val title: String,
    val amount: Long,
    val currency: String,
    val type: TransactionType, // INCOME, EXPENSE
    val date: String,
    val description: String = "",
    val status: String = "Completed"
)

/**
 * Transaction type
 */
enum class TransactionType {
    INCOME,
    EXPENSE
}

/**
 * Top-up method model
 */
data class TopUpMethodModel(
    val id: String,
    val name: String,
    val icon: String,
    val amount: Long
)

// ============================================
// UI Composables
// ============================================

/**
 * Display Wallet UI State as Composable
 */
@Composable
fun WalletUi(
    viewModel: WalletViewModel = LocalViewModel.current
) {
    val uiState by viewModel.uiState.collectAsState()

    when (val state = uiState) {
        is UiState.Initial -> {
            // Show initial state
        }
        is UiState.Loading -> {
            // Show loading indicator
        }
        is UiState.Success -> {
            // Show wallet data
            WalletDataUi(
                wallet = state.wallet,
                onAddMoneyClick = { viewModel.loadWallet() }
            )
        }
        is UiState.Error -> {
            // Show error state
            ErrorState(message = state.error)
            viewModel.clearError()
        }
    }
}

/**
 * Wallet Data UI
 */
@Composable
fun WalletDataUi(
    wallet: WalletData,
    onAddMoneyClick: () -> Unit
) {
    Column(modifier = Modifier.fillMaxSize()) {
        // Header
        WalletHeader()

        // Balance Card
        BalanceCard(balance = wallet.balance)

        // Actions
        Column(modifier = Modifier.padding(16.dp)) {
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Quick Actions",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(8.dp))

            // Top-up button
            Button(
                onClick = onAddMoneyClick,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.primary
                )
            ) {
                Icon(
                    imageVector = Icons.Default.Add,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onPrimary
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text("Top-up Wallet")
            }
        }

        // Recent Transactions
        SectionTitle("Recent Transactions")
        TransactionsList(transactions = wallet.transactions)
    }
}

/**
 * Wallet Header
 */
@Composable
fun WalletHeader() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Arrangement.Center
            ) {
                Text(
                    text = "My Wallet",
                    style = MaterialTheme.typography.titleMedium
                )
                
                Icon(
                    imageVector = Icons.Default.AccountCircle,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "Hello, User!",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

/**
 * Balance Card
 */
@Composable
fun BalanceCard(balance: Long) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Arrangement.Center
            ) {
                Column {
                    Text(
                        text = "Available Balance",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(4.dp))

                    Text(
                        text = "\$$balance",
                        style = MaterialTheme.typography.displayLarge,
                        color = MaterialTheme.colorScheme.primary
                    )
                }

                Text(
                    text = "VND",
                    style = MaterialTheme.typography.displayMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Arrangement.Center) {
                    Icon(
                        imageVector = Icons.Default.ArrowUpward,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "Total Spent",
                        style = MaterialTheme.typography.bodySmall
                    )
                }
                
                Text(
                    text = "12.5M VND",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Arrangement.Center) {
                    Icon(
                        imageVector = Icons.Default.ArrowDownward,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "Total Earned",
                        style = MaterialTheme.typography.bodySmall
                    )
                }
                
                Text(
                    text = "45.2M VND",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

/**
 * Section Title
 */
@Composable
fun SectionTitle(text: String) {
    Text(
        text = text,
        style = MaterialTheme.typography.titleMedium,
        color = MaterialTheme.colorScheme.onSurface
    )
}

/**
 * Transactions List
 */
@Composable
fun TransactionsList(transactions: List<TransactionModel>) {
    if (transactions.isEmpty()) {
        EmptyState("No transactions yet")
    } else {
        LazyColumn {
            items(transactions) { transaction ->
                TransactionCard(transaction)
            }
        }
    }
}

/**
 * Transaction Card
 */
@Composable
fun TransactionCard(transaction: TransactionModel) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp, horizontal = 8.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp)
        ) {
            // Icon based on transaction type
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .padding(12.dp)
            ) {
                Icon(
                    imageVector = when (transaction.type) {
                        TransactionType.INCOME -> Icons.Default.ArrowDownward
                        TransactionType.EXPENSE -> Icons.Default.ArrowUpward
                    },
                    contentDescription = null,
                    tint = if (transaction.type == TransactionType.INCOME) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            // Transaction details
            Column(
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = transaction.title,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface
                )
                
                Text(
                    text = transaction.amount.toString() + " " + transaction.currency,
                    style = MaterialTheme.typography.bodyMedium,
                    color = if (transaction.type == TransactionType.INCOME) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.weight(1f)
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Arrangement.Center
                ) {
                    Text(
                        text = transaction.date,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    Text(
                        text = transaction.status,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

/**
 * Empty State
 */
@Composable
fun EmptyState(message: String) {
    Card(
        modifier = Modifier.fillMaxSize(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(32.dp)
                .centerContent()
        ) {
            Icon(
                imageVector = Icons.Default.Inbox,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
            
            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = message,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

/**
 * Error State
 */
@Composable
fun ErrorState(message: String) {
    Card(
        modifier = Modifier.fillMaxSize(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(32.dp)
                .centerContent()
        ) {
            Icon(
                imageVector = Icons.Default.Error,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.error
            )
            
            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "Error",
                style = MaterialTheme.typography.headlineMedium,
                color = MaterialTheme.colorScheme.error
            )
            
            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = message,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.weight(1f))

            Button(
                onClick = { viewModel.clearError() },
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.primary
                )
            ) {
                Text("Retry")
            }
        }
    }
}
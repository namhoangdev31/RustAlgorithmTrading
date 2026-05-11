package com.lepos.lepos.viewmodels

import androidx.compose.runtime.*
import com.lepos.lepos.data.port.BundledWebApp
import com.lepos.lepos.data.port.BundleDownloader
import com.lepos.lepos.domain.port.MiniAppRepository
import com.lepos.lepos.model.MiniAppModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.withContext
import org.koin.core.component.inject

/**
 * ViewModel for MiniAppStore - Manages browsing and loading Mini Apps
 * 
 * Architecture: MVVM with Repository Pattern
 * - Follows Clean Architecture principles
 * - Uses Koin for dependency injection
 */
class MiniAppStoreViewModel(
    private val miniAppRepository: MiniAppRepository,
    private val bundleDownloader: BundleDownloader
) {
    // Private properties for internal use
    private val _uiState = MutableStateFlow(InitialUiState())
    val uiState = _uiState.asStateFlow()

    // Public properties for navigation
    val selectedMiniApp: StateFlow<MiniAppModel?> = StateFlow<MiniAppModel?>(null)
    
    // Navigation parameters
    val searchQuery = MutableStateFlow("")
    val category = MutableStateFlow("")
    
    private var _selectedMiniApp: MiniAppModel? = null
    private var _isLoading: Boolean = false
    private var _error: String? = null

    // Initialize with default category
    init {
        loadMiniApps(category.value)
    }

    /**
     * Load Mini Apps from repository
     * - Uses repository pattern to get data
     * - Handles network calls via BundleDownloader
     * - Updates UI state
     */
    suspend fun loadMiniApps(category: String) {
        _isLoading = true
        _error = null

        try {
            val results = withContext(Dispatchers.IO) {
                miniAppRepository.searchMiniApps(category = category)
            }

            _isLoading = false

            if (_error == null) {
                _uiState.value = UiState.Success(results)
            }
        } catch (e: Exception) {
            _isLoading = false
            _error = e.localizedMessage ?: "Unknown error occurred"
            _uiState.value = UiState.Error(_error)
        }
    }

    /**
     * Get Mini App by ID
     */
    suspend fun getMiniAppById(miniAppId: String): MiniAppModel {
        return withContext(Dispatchers.IO) {
            miniAppRepository.getMiniAppById(miniAppId)
        }
    }

    /**
     * Get list of Mini Apps
     */
    suspend fun getMiniApps(): List<MiniAppModel> {
        return withContext(Dispatchers.IO) {
            miniAppRepository.getAllMiniApps()
        }
    }

    /**
     * Select Mini App for navigation
     * Triggers BundleDownloader to load the app bundle
     */
    fun selectMiniApp(miniApp: MiniAppModel) {
        _selectedMiniApp = miniApp

        // Download and load the bundle
        _isLoading = true

        withContext(Dispatchers.IO) {
            val bundle = withContext(Dispatchers.IO) {
                bundleDownloader.downloadBundle(miniApp.miniAppId)
            }

            val bundledApp = BundledWebApp(
                appId = miniApp.miniAppId,
                name = miniApp.name,
                version = miniApp.version,
                bundle = bundle
            )

            _isLoading = false
            _uiState.value = UiState.LoadingBundle(miniApp, bundledApp)
        }
    }

    /**
     * Get search query
     */
    fun getSearchQuery(): String = searchQuery.value

    /**
     * Set search query with debounce
     */
    fun setSearchQuery(query: String) {
        searchQuery.value = query
        loadMiniApps("") // Reset to all categories
    }

    /**
     * Get category filter
     */
    fun getCategoryId(): Int = category.value

    /**
     * Set category filter
     */
    fun setCategoryId(category: Int) {
        category.value = category
        loadMiniApps(category.value)
    }

    /**
     * Reset filters
     */
    fun resetFilters() {
        searchQuery.value = ""
        category.value = 0
        loadMiniApps(0)
    }

    /**
     * Check if app is being loaded
     */
    fun isAppLoading(appId: String): Boolean {
        val currentState = _uiState.value
        return currentState is UiState.LoadingBundle && currentState.miniApp.miniAppId == appId
    }

    /**
     * Clear error state
     */
    fun clearError() {
        _error = null
        _uiState.value = _uiState.value.copy(error = null)
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
    val miniApps = emptyList<MiniAppModel>()
}

/**
 * Complete UI state for ViewModel
 */
sealed class UiState {
    object Initial : UiState()
    object Loading : UiState()
    data class Success(val miniApps: List<MiniAppModel>) : UiState()
    data class LoadingBundle(
        val miniApp: MiniAppModel,
        val bundledApp: BundledWebApp
    ) : UiState() {
        val isLoading = true
    }
    data class Error(val message: String) : UiState() {
        val isLoading = false
        val error = message
        val miniApps = emptyList<MiniAppModel>()
    }
}

/**
 * Extended state with loading flag for better UI control
 */
data class ExtendedUiState(
    val isLoading: Boolean = false,
    val error: String? = null,
    val miniApps: List<MiniAppModel> = emptyList()
)

// ============================================
// UI Composables
// ============================================

/**
 * Display UiState as Composable
 */
@Composable
fun MiniAppStoreUi(
    viewModel: MiniAppStoreViewModel = LocalViewModel.current,
    onMiniAppClick: (MiniAppModel) -> Unit = { /* navigate */ }
) {
    val uiState by viewModel.uiState.collectAsState()
    val searchQuery by viewModel.getSearchQuery().collectAsState()
    val selectedMiniApp by viewModel.selectedMiniApp.collectAsState()

    when (val state = uiState) {
        is UiState.Initial -> {
            // Show loading or empty state
        }
        is UiState.Loading -> {
            // Show loading indicator
        }
        is UiState.Success -> {
            // Show Mini Apps grid
            MiniAppsGrid(
                miniApps = state.miniApps,
                onMiniAppClick = onMiniAppClick
            )
        }
        is UiState.LoadingBundle -> {
            // Show loading bundle state
            LoadingBundleState(
                miniApp = state.miniApp,
                progress = viewModel.progressForMiniApp(state.miniApp),
                selectedMiniApp = state.bundledApp
            ) {
                onMiniAppClick(state.miniApp)
            }
        }
        is UiState.Error -> {
            // Show error state
            ErrorState(message = state.error)
            viewModel.clearError()
        }
    }
}

/**
 * Mini Apps Grid Layout
 */
@Composable
fun MiniAppsGrid(
    miniApps: List<MiniAppModel>,
    onMiniAppClick: (MiniAppModel) -> Unit
) {
    Column(modifier = Modifier.fillMaxSize()) {
        // Search and filter header
        Header(
            title = "Mini Apps Store",
            searchQuery = miniApps
        )

        // Mini Apps list
        if (miniApps.isEmpty()) {
            EmptyState("No Mini Apps found")
        } else {
            LazyColumn {
                items(
                    miniApps,
                    key = { it.miniAppId }
                ) { miniApp ->
                    MiniAppCard(
                        miniApp = miniApp,
                        onClick = { onMiniAppClick(miniApp) }
                    )
                }
            }
        }

        // Bottom navigation
        BottomNavigation(
            modifier = Modifier.fillMaxWidth(),
            containerColor = MaterialTheme.colorScheme.surface
        ) {
            // Add bottom navigation items
        }
    }
}

/**
 * Header with search functionality
 */
@Composable
fun Header(
    title: String,
    searchQuery: List<MiniAppModel>
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(8.dp))
            
            // Search input
            OutlinedTextField(
                value = searchQuery.isEmpty() { "" },
                onValueChange = {}, // Connected to viewModel.setSearchQuery
                label = { Text("Search Mini Apps") },
                placeholder = { Text("Try 'Games', 'Finance', 'Productivity'") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )
        }
    }
}

/**
 * Mini App Card Component
 */
@Composable
fun MiniAppCard(
    miniApp: MiniAppModel,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp, horizontal = 8.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp)
        ) {
            Text(
                text = miniApp.name,
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.weight(1f)
            )
            
            Text(
                text = "@${miniApp.author}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            
            Text(
                text = miniApp.description,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 2
            )

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Arrangement.Center) {
                    Text(
                        text = "V${miniApp.version}",
                        style = MaterialTheme.typography.bodyMedium
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Icon(
                        imageVector = Icons.Default.Info,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary
                    )
                }

                Text(
                    text = "v${miniApp.version}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

// ============================================
// Bundle Loading State
// ============================================

@Composable
fun LoadingBundleState(
    miniApp: MiniAppModel,
    progress: Float,
    selectedMiniApp: BundledWebApp,
    onAppReady: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxSize(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp)
        ) {
            Text(
                text = "Loading $miniApp...",
                style = MaterialTheme.typography.headlineSmall,
                color = MaterialTheme.colorScheme.primary
            )
            
            LinearProgressIndicator(
                progress = progress,
                modifier = Modifier.padding(24.dp)
            )

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "This Mini App will open in full screen",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

// ============================================
// Error State
// ============================================

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
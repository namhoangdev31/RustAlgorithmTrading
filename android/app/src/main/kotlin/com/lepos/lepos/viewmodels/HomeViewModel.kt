package com.lepos.lepos.viewmodels

import androidx.compose.runtime.*
import com.lepos.lepos.model.MiniAppModel
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.flow
import org.koin.core.component.inject

/**
 * ViewModel for Home screen - Manages main app navigation and user experience
 * 
 * Architecture: MVVM with Repository Pattern
 * - Follows Clean Architecture principles
 * - Uses Koin for dependency injection
 */
class HomeViewModel(
    private val miniAppRepository: MiniAppRepository,
    private val walletViewModel: WalletViewModel
) {
    // Private properties for internal use
    private val _uiState = MutableStateFlow(InitialUiState())
    val uiState: StateFlow<UiState> = _uiState.asStateFlow()

    // Navigation parameters
    val searchQuery = MutableStateFlow("")
    val selectedCategory: MutableStateFlow<String> = MutableStateFlow("")
    
    private val _selectedMiniApp: MutableStateFlow<MiniAppModel?> = MutableStateFlow(null)
    val selectedMiniApp: StateFlow<MiniAppModel?> = _selectedMiniApp.asStateFlow()
    
    private var _isLoading: Boolean = false
    private var _error: String? = null

    // Initialize with default search query
    init {
        loadMiniApps()
    }

    /**
     * Load Mini Apps from repository
     * - Uses repository pattern to get data
     * - Handles network calls
     * - Updates UI state
     */
    suspend fun loadMiniApps() {
        _isLoading = true
        _error = null

        try {
            val results = withContext(Dispatchers.IO) {
                miniAppRepository.searchMiniApps(category = selectedCategory.value)
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
     * Set search query
     */
    fun setSearchQuery(query: String) {
        searchQuery.value = query
        _error = null
        _uiState.value = UiState.Loading

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val results = withContext(Dispatchers.IO) {
                    miniAppRepository.searchMiniApps(category = "")
                }
                _uiState.value = UiState.Success(results)
            } catch (e: Exception) {
                _error = e.localizedMessage ?: "Failed to load Mini Apps"
                _uiState.value = UiState.Error(_error)
            }
        }
    }

    /**
     * Set category filter
     */
    fun setCategory(category: String) {
        selectedCategory.value = category
        _error = null
        _uiState.value = UiState.Loading

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val results = withContext(Dispatchers.IO) {
                    miniAppRepository.searchMiniApps(category = category)
                }
                _uiState.value = UiState.Success(results)
            } catch (e: Exception) {
                _error = e.localizedMessage ?: "Failed to load Mini Apps"
                _uiState.value = UiState.Error(_error)
            }
        }
    }

    /**
     * Select Mini App
     */
    fun selectMiniApp(miniApp: MiniAppModel) {
        _selectedMiniApp.value = miniApp
        _uiState.value = UiState.Selected(miniApp)
    }

    /**
     * Clear selection
     */
    fun clearSelection() {
        _selectedMiniApp.value = null
        _uiState.value = UiState.None
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
        return _isLoading || _uiState.value is UiState.Loading
    }

    // Property accessors
    fun getSearchQuery(): String = searchQuery.value
    fun getSelectedCategory(): String = selectedCategory.value
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
    val selectedMiniApp: MiniAppModel? = null
}

/**
 * Complete UI state for ViewModel
 */
sealed class UiState {
    object None : UiState() {
        val isLoading = false
        val error: String? = null
        val miniApps = emptyList<MiniAppModel>()
    }
    
    object Loading : UiState() {
        val isLoading = true
        val error: String? = null
        val miniApps = emptyList<MiniAppModel>()
    }
    
    data class Success(val miniApps: List<MiniAppModel>) : UiState() {
        val isLoading = false
        val error: String? = null
    }
    
    data class Error(val message: String) : UiState() {
        val isLoading = false
        val error = message
        val miniApps = emptyList<MiniAppModel>()
    }
    
    data class Selected(val miniApp: MiniAppModel) : UiState() {
        val isLoading = false
        val error: String? = null
    }
}
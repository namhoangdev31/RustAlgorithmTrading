package com.lepos.lepos.ui.store

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.lepos.lepos.domain.model.bundle.Bundle
import com.lepos.lepos.domain.usecase.DownloadBundleUseCase
import com.lepos.lepos.domain.usecase.GetBundlesUseCase
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class StoreUiState(
    val loading: Boolean = false,
    val bundles: List<Bundle> = emptyList(),
    val downloadingId: String? = null,
    val error: String? = null,
    val launchPath: String? = null // One-shot event to launch
)

class MiniAppStoreViewModel(
    private val getBundlesUseCase: GetBundlesUseCase,
    private val downloadBundleUseCase: DownloadBundleUseCase
) : ViewModel() {

    private val _state = MutableStateFlow(StoreUiState())
    val state: StateFlow<StoreUiState> = _state.asStateFlow()

    fun loadBundles() {
        viewModelScope.launch {
            _state.update { it.copy(loading = true, error = null) }
            getBundlesUseCase()
                .onSuccess { bundles ->
                    _state.update { it.copy(loading = false, bundles = bundles) }
                }
                .onError { error ->
                    _state.update { it.copy(loading = false, error = error.message ?: "Unknown error") }
                }
        }
    }

    fun downloadAndLaunch(bundle: Bundle) {
        if (_state.value.downloadingId != null) return

        viewModelScope.launch {
            _state.update { it.copy(downloadingId = bundle.id, error = null) }
            
            downloadBundleUseCase(bundle)
                .onSuccess { path ->
                     _state.update { it.copy(downloadingId = null, launchPath = path) }
                }
                .onError { error ->
                    _state.update { it.copy(downloadingId = null, error = "Download failed: ${error.message}") }
                }
        }
    }
    
    fun onLaunchConsumed() {
        _state.update { it.copy(launchPath = null) }
    }
}

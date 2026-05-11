package com.lepos.lepos.ui.webruntime

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.lepos.lepos.domain.model.WebRuntimeManifest
import com.lepos.lepos.runtime.WebRuntimeState

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class WebRuntimeViewModel(application: Application) : AndroidViewModel(application) {
    private val _state = MutableStateFlow<WebRuntimeState>(WebRuntimeState.Idle)
    val state: StateFlow<WebRuntimeState> = _state
    
    private var server: AndroidWebServer? = null
    private val serverPort = 8080


    

    
    fun loadBundle(manifest: WebRuntimeManifest, bundlePath: String) {
        viewModelScope.launch {
            loadBundleInternal(manifest, bundlePath)
        }
    }
    
    private suspend fun loadBundleInternal(manifest: WebRuntimeManifest, bundlePath: String) {
        _state.value = WebRuntimeState.Loading
        
        try {
            // 1. Start embedded HTTP server (Infrastructure)
            server = AndroidWebServer(port = serverPort, basePath = bundlePath).also {
                it.start()
            }
            
            // 2. Resolve URL logic (Business Logic via UseCase)
            // Inlined from deleted LoadBundleUseCase
            val httpUrl = "http://127.0.0.1:$serverPort"
            
            if (httpUrl != null) {
                _state.value = WebRuntimeState.Ready(entryUrl = httpUrl)
            } else {
                _state.value = WebRuntimeState.Error(message = "Failed to resolve bundle URL")
            }
        } catch (e: Exception) {
            _state.value = WebRuntimeState.Error(message = "Failed to start server: ${e.message}")
        }
    }

    
    override fun onCleared() {
        super.onCleared()
        server?.stop()
        server = null
    }
}

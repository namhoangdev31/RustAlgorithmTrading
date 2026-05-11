package com.lepos.lepos.ui.miniappdetails

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.lepos.lepos.domain.model.RuntimeType
import com.lepos.lepos.domain.model.WebRuntimeManifest
import com.lepos.lepos.domain.model.bundle.*
import com.lepos.lepos.domain.usecase.*
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.io.File

class MiniAppDetailsViewModel(
    private val downloadBundleUseCase: DownloadBundleUseCase,
    private val getBundleStatsUseCase: GetBundleStatsUseCase,
    private val getBundlePromotionsUseCase: GetBundlePromotionsUseCase,
    private val trackBundleDownloadUseCase: TrackBundleDownloadUseCase,
    private val context: Context
) : ViewModel() {

    private val _isDownloaded = MutableStateFlow(false)
    val isDownloaded: StateFlow<Boolean> = _isDownloaded.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _bundleStats = MutableStateFlow<BundleStats?>(null)
    val bundleStats: StateFlow<BundleStats?> = _bundleStats.asStateFlow()

    private val _promotions = MutableStateFlow<List<BundlePromotion>>(emptyList())
    val promotions: StateFlow<List<BundlePromotion>> = _promotions.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    private val _launchManifest = MutableStateFlow<WebRuntimeManifest?>(null)
    val launchManifest: StateFlow<WebRuntimeManifest?> = _launchManifest.asStateFlow()

    fun loadBundleDetails(bundleId: String) {
        viewModelScope.launch {
            _isLoading.value = true
            
            // Parallel fetching
            val statsDeferred = async { getBundleStatsUseCase(bundleId) }
            val promotionsDeferred = async { getBundlePromotionsUseCase(bundleId) }
            
            val statsResult = statsDeferred.await()
            val promotionsResult = promotionsDeferred.await()
            
            if (statsResult is com.lepos.lepos.core.Result.Success) {
                _bundleStats.value = statsResult.data
            }
            
            if (promotionsResult is com.lepos.lepos.core.Result.Success) {
                _promotions.value = promotionsResult.data
            }
            
            _isLoading.value = false
        }
    }

    fun checkDownloadStatus(bundle: Bundle) {
        val miniAppsDir = File(context.filesDir, "mini-apps")
        val bundleDir = File(miniAppsDir, bundle.id)
        val manifestFile = File(bundleDir, "manifest.json")
        _isDownloaded.value = manifestFile.exists()
    }

    fun downloadAndOpen(bundle: Bundle) {
        if (_isLoading.value) return

        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null

            downloadBundleUseCase.invoke(bundle)
                .onSuccess { path ->
                    _isDownloaded.value = true
                    parseManifestAndLaunch(path, bundle)
                    
                    // Track download in background
                    viewModelScope.launch {
                        trackBundleDownloadUseCase.invoke(bundle.id)
                    }
                    
                    _isLoading.value = false
                }
                .onError { error ->
                    _error.value = error.message
                    _isLoading.value = false
                }
        }
    }

    fun openMiniApp(bundle: Bundle) {
        val miniAppsDir = File(context.filesDir, "mini-apps")
        val bundleDir = File(miniAppsDir, bundle.id)

        if (bundleDir.exists()) {
            parseManifestAndLaunch(bundleDir.absolutePath, bundle)
        } else {
            // Re-download if missing
            downloadAndOpen(bundle)
        }
    }

    fun uninstallBundle(bundle: Bundle) {
        try {
            val miniAppsDir = File(context.filesDir, "mini-apps")
            val bundleDir = File(miniAppsDir, bundle.id)
            if (bundleDir.exists()) {
                bundleDir.deleteRecursively()
                _isDownloaded.value = false
            }
        } catch (e: Exception) {
            _error.value = "Uninstall failed: ${e.message}"
        }
    }

    private fun parseManifestAndLaunch(path: String, bundle: Bundle) {
        try {
            val manifestFile = File(path, "manifest.json")
            if (manifestFile.exists()) {
                val content = manifestFile.readText()
                val json = JSONObject(content)

                val id = json.optString("id", bundle.id)
                val version = json.optString("version", "1")
                val name = json.optString("name", bundle.name)
                val entry = json.optString("entry", "index.html")
                val typeString = json.optString("type", "STANDARD").uppercase()
                val orientation = json.optString("orientation", "portrait")
                val fullScreen = json.optBoolean("fullScreen", true)

                val runtimeType =
                    if (typeString == "FLUTTER") RuntimeType.FLUTTER else RuntimeType.STANDARD

                val manifest = WebRuntimeManifest(
                    id = id,
                    version = version,
                    name = name,
                    entry = entry,
                    type = runtimeType,
                    orientation = orientation,
                    fullScreen = fullScreen
                )
                _launchManifest.value = manifest
            }
        } catch (e: Exception) {
            _error.value = "Invalid manifest: ${e.message}"
        }
    }

    fun clearLaunchManifest() {
        _launchManifest.value = null
    }
}

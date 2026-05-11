package com.lepos.lepos.ui.webruntime

import android.content.pm.ActivityInfo
import android.os.Bundle
import android.view.ViewGroup
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.view.WindowCompat
import com.lepos.lepos.ui.components.AssistiveTouch
import com.lepos.lepos.domain.model.WebRuntimeManifest // Updated Import
import com.lepos.lepos.domain.model.RuntimeType // Added Import
import com.lepos.lepos.runtime.WebRuntimeState
import java.io.File

class WebRuntimeActivity : ComponentActivity() {
    private val viewModel: WebRuntimeViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 1. Force Edge-to-Edge with Transparent Bars
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.auto(Color.Transparent.toArgb(), Color.Transparent.toArgb()),
            navigationBarStyle = SystemBarStyle.auto(Color.Transparent.toArgb(), Color.Transparent.toArgb())
        )
        WindowCompat.setDecorFitsSystemWindows(window, false)

        // 2. Load Manifest & Bundle Path
        val manifestJson = intent.getStringExtra("MANIFEST_JSON")
        val manifest = if (manifestJson != null) {
            kotlinx.serialization.json.Json.decodeFromString<WebRuntimeManifest>(manifestJson)
        } else {
            WebRuntimeManifest(
                id = "test_app",
                version = "1", // Fixed type mismatch
                name = "Test App",
                entry = "index.html",
                type = RuntimeType.STANDARD, // Added missing required field
                orientation = "portrait",
                fullScreen = true // Added missing required field
            )
        }

        val bundlePath = intent.getStringExtra("BUNDLE_PATH")
            ?: (filesDir.absolutePath + "/bundles/${manifest.id}")

        // 3. Orientation Lock
        requestedOrientation = when (manifest.orientation) {
            "landscape" -> ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
            "portrait" -> ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
            else -> ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
        }

        viewModel.loadBundle(manifest, bundlePath)

        setContent {
            val state by viewModel.state.collectAsState()

            Box(
                modifier = Modifier
                    .fillMaxSize()
            ) {
                // 4. Full Screen WebView Container
                if (state is WebRuntimeState.Ready) {
                    val entryUrl = (state as WebRuntimeState.Ready).entryUrl
                    AndroidView(
                        factory = { context ->
                            RuntimeWebView(context).apply {
                                layoutParams = ViewGroup.LayoutParams(
                                    ViewGroup.LayoutParams.MATCH_PARENT,
                                    ViewGroup.LayoutParams.MATCH_PARENT
                                )
                                loadBundle(manifest, entryUrl)
                            }
                        },
                        modifier = Modifier
                            .fillMaxSize()
                            .systemBarsPadding() // Use Native Padding instead of CSS
                    )
                }

                // 5. Loading / Error Overlays
                when (state) {
                    is WebRuntimeState.Loading -> {
                        // Show Loading UI
                         androidx.compose.material3.CircularProgressIndicator(
                            modifier = Modifier.align(Alignment.Center),
                            color = Color.White
                         )
                    }
                    is WebRuntimeState.Error -> {
                         androidx.compose.material3.Text(
                            text = (state as WebRuntimeState.Error).message,
                            color = Color.Red,
                            modifier = Modifier.align(Alignment.Center)
                         )
                    }
                    else -> {}
                }

                // 6. Assistive Touch (Always on top)
                AssistiveTouch(
                    onBack = { finish() },
                    onHome = { finish() },
                    onReload = { recreate() }
                )
            }
        }
    }
}

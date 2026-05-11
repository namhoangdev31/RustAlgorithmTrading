package com.lepos.lepos.ui.webruntime

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.viewmodel.compose.viewModel
import com.lepos.lepos.domain.model.WebRuntimeManifest
import com.lepos.lepos.runtime.WebRuntimeState
import com.lepos.lepos.ui.components.AssistiveTouch

@Composable
fun RuntimeScreen(
    manifest: WebRuntimeManifest,
    bundlePath: String,
    onClose: () -> Unit
) {
    // We can use the existing WebRuntimeViewModel, or a new instance scoped to this screen
    val viewModel: WebRuntimeViewModel = viewModel()

    LaunchedEffect(manifest, bundlePath) {
        viewModel.loadBundle(manifest, bundlePath)
    }

    val state by viewModel.state.collectAsState()

    Box(
        modifier = Modifier.fillMaxSize()
    ) {
        // 1. Full Screen WebView Container
        if (state is WebRuntimeState.Ready) {
            val entryUrl = (state as WebRuntimeState.Ready).entryUrl
            AndroidView(
                factory = { context ->
                    RuntimeWebView(context).apply {
                       // Layout params might be needed if not filling parent by default
                        loadBundle(manifest, entryUrl)
                    }
                },
                modifier = Modifier
                    .fillMaxSize()
                    .systemBarsPadding() 
            )
        }

        // 2. Loading / Error Overlays
        when (state) {
            is WebRuntimeState.Loading -> {
                CircularProgressIndicator(
                    modifier = Modifier.align(Alignment.Center),
                    color = Color.White
                )
            }
            is WebRuntimeState.Error -> {
                Text(
                    text = (state as WebRuntimeState.Error).message,
                    color = Color.Red,
                    modifier = Modifier.align(Alignment.Center)
                )
            }
            else -> {}
        }

        // 3. Assistive Touch
        AssistiveTouch(
            onBack = onClose,
            onHome = onClose,
            onReload = { 
                viewModel.loadBundle(manifest, bundlePath)
            }
        )
    }
}

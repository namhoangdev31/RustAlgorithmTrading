package com.lepos.lepos.ui.store

import android.content.Intent
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.lepos.lepos.domain.model.RuntimeType
import com.lepos.lepos.domain.model.bundle.Bundle
import com.lepos.lepos.domain.model.WebRuntimeManifest
import com.lepos.lepos.ui.webruntime.WebRuntimeActivity
import kotlinx.serialization.json.Json
import org.koin.androidx.compose.koinViewModel
import java.io.File

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MiniAppStoreScreen(
    viewModel: MiniAppStoreViewModel = koinViewModel()
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val context = LocalContext.current

    LaunchedEffect(Unit) {
        viewModel.loadBundles()
    }

    // Handle Launch Side Effect
    LaunchedEffect(state.launchPath) {
        state.launchPath?.let { path ->
            val bundleId = state.downloadingId ?: "unknown" // Ideally pass bundle object in event
            // Re-find bundle to get name
            // For now, simpler approach: The VM should probably pass a "LaunchIntent" object or similar.
            // But let's reconstruct the manifest here for now to match previous logic.
            // We need the ID and Name.
            // A better way: VM passes the Bundle object + Path.
            // Let's assume we find it from the list for now.
            val bundle = state.bundles.find { it.id == state.downloadingId }
                ?: state.bundles.firstOrNull() // Fallback if list cleared?

            if (bundle != null) {
                launchMiniApp(context, bundle, path)
            }

            viewModel.onLaunchConsumed()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Mini-App Store") },
                actions = {
                    IconButton(onClick = { viewModel.loadBundles() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                }
            )
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
        ) {
            if (state.loading) {
                CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    items(state.bundles) { bundle ->
                        MiniAppItem(
                            bundle = bundle,
                            isDownloading = state.downloadingId == bundle.id,
                            onPlay = { viewModel.downloadAndLaunch(bundle) }
                        )
                    }
                }
            }

            state.error?.let { error ->
                Text(
                    text = error,
                    color = MaterialTheme.colorScheme.error,
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(16.dp)
                )
            }
        }
    }
}

@Composable
fun MiniAppItem(bundle: Bundle, isDownloading: Boolean, onPlay: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(4.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(text = bundle.name, style = MaterialTheme.typography.titleMedium)
                Text(text = "ID: ${bundle.id}", style = MaterialTheme.typography.bodySmall)
            }

            if (isDownloading) {
                CircularProgressIndicator(modifier = Modifier.size(24.dp))
            } else {
                IconButton(onClick = onPlay) {
                    Icon(Icons.Default.PlayArrow, contentDescription = "Play")
                }
            }
        }
    }
}

private fun launchMiniApp(context: android.content.Context, bundle: Bundle, path: String) {
    // Logic to find index.html if needed, similar to before
    // The path returned by downloader is the bundle root.
    val bundleDir = File(path)
    val realRootDir = bundleDir.walkTopDown()
        .maxDepth(2)
        .find { it.name == "index.html" }
        ?.parentFile
        ?: bundleDir

    val manifest = WebRuntimeManifest(
        id = bundle.id,
        version = bundle.version,
        name = bundle.name,
        entry = "index.html",
        type = RuntimeType.STANDARD
    )
    val manifestJson = Json.encodeToString(manifest)

    val intent = Intent(context, WebRuntimeActivity::class.java).apply {
        putExtra("MANIFEST_JSON", manifestJson)
        putExtra("BUNDLE_PATH", realRootDir.absolutePath)
    }
    context.startActivity(intent)
}

package com.lepos.lepos.ui.miniappdetails

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.lepos.lepos.domain.model.bundle.*
import com.lepos.lepos.domain.services.AppInstallationService
import com.lepos.lepos.ui.miniappdetails.components.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import org.koin.androidx.compose.koinViewModel

@Composable
fun MiniAppDetailsScreen(
    bundleId: String,
    viewModel: MiniAppDetailsViewModel = koinViewModel(),
    onBack: () -> Unit,
    onWriteReview: () -> Unit,
    onDeveloperClick: () -> Unit,
    onSeeAllReviews: () -> Unit,
    onCheckout: (Double) -> Unit,
    onOpenMiniApp: (com.lepos.lepos.domain.model.WebRuntimeManifest) -> Unit
) {
    // Observe ViewModel State
    val isDownloaded by viewModel.isDownloaded.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val bundleStats by viewModel.bundleStats.collectAsState()
    val promotions by viewModel.promotions.collectAsState()
    val launchManifest by viewModel.launchManifest.collectAsState()
    
    val scope = rememberCoroutineScope()
    
    // LaunchedEffect for data loading
    LaunchedEffect(bundleId) {
        viewModel.loadBundleDetails(bundleId)
    }

    // Launch app when manifest is ready
    LaunchedEffect(launchManifest) {
        launchManifest?.let {
            onOpenMiniApp(it)
            viewModel.clearLaunchManifest()
        }
    }
    
    // Mock Price for demo
    val price = 29.99

    Box(modifier = Modifier.fillMaxSize()) {
        Scaffold(
            topBar = {
                // Should match iOS navigation bar style usually
            }
        ) { paddingValues ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .verticalScroll(rememberScrollState())
                    .padding(bottom = 80.dp) // Space for sticky footer
            ) {
                // Header Section
                MiniAppHeader(
                    isDownloaded = isDownloaded,
                    isLoading = isLoading,
                    onOpen = { 
                        // Implementation moved to ViewModel/UseTask but for now we follow the existing pattern if it works
                        // or better: let ViewModel handle it
                        // viewModel.openMiniApp(...)
                    },
                    onDownload = {
                        // Mock Bundle for now as we don't have the full object here yet easily without extra fetch
                        // In real app, we'd pass the actual Bundle object.
                    },
                    onUninstall = {
                        // viewModel.uninstallBundle(...)
                    },
                    onDeveloperClick = onDeveloperClick
                )

                HorizontalDivider(thickness = 0.5.dp, color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f), modifier = Modifier.padding(horizontal = 16.dp))

                // Ratings Row
                RatingStats(bundleStats)

                HorizontalDivider(thickness = 0.5.dp, color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f), modifier = Modifier.padding(horizontal = 16.dp))
                
                // What's New
                WhatsNewSection()
                
                HorizontalDivider(thickness = 0.5.dp, color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f), modifier = Modifier.padding(horizontal = 16.dp))
                
                // Preview
                PreviewSection()
                
                HorizontalDivider(thickness = 0.5.dp, color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f), modifier = Modifier.padding(horizontal = 16.dp))
                
                // Description
                DescriptionSection()
                
                HorizontalDivider(thickness = 0.5.dp, color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f), modifier = Modifier.padding(horizontal = 16.dp))
                
                // Reviews
                ReviewSection(
                    onWriteReview = onWriteReview,
                    onSeeAllReviews = onSeeAllReviews
                )
                
                HorizontalDivider(thickness = 0.5.dp, color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f), modifier = Modifier.padding(horizontal = 16.dp))
                
                // Info
                InformationSection(bundle = null, promotions = promotions)
                
                HorizontalDivider(thickness = 0.5.dp, color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f), modifier = Modifier.padding(horizontal = 16.dp))
                
                // Related Apps
                RelatedAppsSection()
            }
        }
        
        // Sticky Footer
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
        ) {
            StickyFooter(
                isDownloaded = isDownloaded,
                onOpen = {
                   // viewModel.openMiniApp(...)
                },
                onDownload = {
                    if (price > 0 && !isDownloaded) {
                        onCheckout(price)
                    } else {
                        // viewModel.downloadAndOpen(...)
                    }
                }
            )
        }
    }
}

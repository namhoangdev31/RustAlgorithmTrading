package com.lepos.lepos.ui.home

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import com.lepos.lepos.ui.components.*
import com.lepos.lepos.ui.home.components.*
import org.koin.androidx.compose.koinViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    viewModel: HomeViewModel = koinViewModel(),
    onItemClick: (String) -> Unit,
    onNotificationClick: () -> Unit,
    onCollectionClick: (String, String) -> Unit
) {
    val state by viewModel.state.collectAsState()

    // Note: Temporarily bypassing ViewModel state for the UI refactor to match static design requirements.
    // In a real scenario, the data should come from the ViewModel.
    
    Scaffold(
        // topBar = { HomeTopBar(...) } // Custom header used instead of TopBar
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
            ) {
                HomeHeader(onNotificationClick = onNotificationClick)
                
                EditorChoice(onClick = { onItemClick("editor_choice") })
                
                AppsWeLove(
                    onCollectionClick = onCollectionClick,
                    onAppClick = onItemClick
                )
                
                TopCollections(onCollectionClick = onCollectionClick)
                
                HomePersonalizedSection(
                    title = "For You",
                    subtitle = "Based on your recent activity"
                )
                
                QuickAccess(onItemClick = onItemClick)
            }
        }
    }
}

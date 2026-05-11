package com.lepos.lepos.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lepos.lepos.ui.search.SearchResultCard
import com.lepos.lepos.ui.search.SearchResultItem

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CollectionDetailScreen(
    collectionId: String,
    title: String,
    onNavigateBack: () -> Unit
) {
    // Mock Data (Reusing SearchResultItem for simplicity)
    val apps = listOf(
        SearchResultItem("1", "Crossfire", "Action", MaterialTheme.colorScheme.error, 4.8),
        SearchResultItem("2", "Task Master", "Productivity", MaterialTheme.colorScheme.primary, 4.5),
        SearchResultItem("3", "EcoLife", "Lifestyle", MaterialTheme.colorScheme.secondary, 4.2),
        SearchResultItem("4", "Pixel Art", "Design", MaterialTheme.colorScheme.tertiary, 4.7),
        SearchResultItem("5", "FitPulse", "Health", MaterialTheme.colorScheme.onSurfaceVariant, 4.6),
        SearchResultItem("6", "CryptoWatch", "Finance", MaterialTheme.colorScheme.onTertiaryContainer, 4.3),
        SearchResultItem("7", "MindfulMoments", "Health", MaterialTheme.colorScheme.secondary, 4.9), // Teal
        SearchResultItem("8", "CodeRunner", "Developer", MaterialTheme.colorScheme.outline, 4.4)
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(title) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { paddingValues ->
        LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            horizontalArrangement = Arrangement.spacedBy(16.dp),
            modifier = Modifier.padding(paddingValues)
        ) {
            items(apps) { item ->
                SearchResultCard(item)
            }
        }
    }
}

package com.lepos.lepos.ui.discovery

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Eco
import androidx.compose.material.icons.filled.Functions
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.MusicNote
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

data class TopChartAppItem(
    val rank: Int,
    val name: String,
    val category: String,
    val icon: ImageVector,
    val iconColor: Color,
    val price: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TopChartsScreen(
    onNavigateBack: () -> Unit,
    onAppClick: (String) -> Unit
) {
    var selectedTab by remember { mutableIntStateOf(0) } // 0: Paid, 1: Free
    
    val paidApps = listOf(
        TopChartAppItem(1, "Pro Camera X", "Photo & Video", Icons.Filled.CameraAlt, MaterialTheme.colorScheme.onSurface, "$4.99"),
        TopChartAppItem(2, "Forest Focus", "Productivity", Icons.Filled.Eco, MaterialTheme.colorScheme.primary, "$1.99"),
        TopChartAppItem(3, "Sky Guide", "Reference", Icons.Filled.Star, MaterialTheme.colorScheme.secondary, "$2.99"),
        TopChartAppItem(4, "WolframAlpha", "Education", Icons.Filled.Functions, MaterialTheme.colorScheme.tertiary, "$2.99"), // Orange
        TopChartAppItem(5, "GoodNotes 6", "Productivity", Icons.Filled.Eco, MaterialTheme.colorScheme.secondaryContainer, "$9.99")
    )
    
    val freeApps = listOf(
        TopChartAppItem(1, "TikTok", "Entertainment", Icons.Filled.MusicNote, MaterialTheme.colorScheme.onSurface, "GET"),
        TopChartAppItem(2, "YouTube", "Photo & Video", Icons.Filled.CameraAlt, MaterialTheme.colorScheme.error, "GET"),
        TopChartAppItem(3, "Instagram", "Photo & Video", Icons.Filled.CameraAlt, MaterialTheme.colorScheme.tertiary, "GET"), // Purple
        TopChartAppItem(4, "WhatsApp", "Social Networking", Icons.Filled.Phone, MaterialTheme.colorScheme.primary, "GET"),
        TopChartAppItem(5, "Google Maps", "Navigation", Icons.Filled.Map, MaterialTheme.colorScheme.secondary, "GET")
    )
    
    val currentApps = if (selectedTab == 0) paidApps else freeApps

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Top Charts") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            TabRow(selectedTabIndex = selectedTab) {
                Tab(selected = selectedTab == 0, onClick = { selectedTab = 0 }, text = { Text("Paid") })
                Tab(selected = selectedTab == 1, onClick = { selectedTab = 1 }, text = { Text("Free") })
            }
            
            LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                items(currentApps) { app ->
                    TopChartItem(app, onClick = { onAppClick("app_id") })
                }
            }
        }
    }
}

@Composable
fun TopChartItem(app: TopChartAppItem, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = "${app.rank}",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.width(32.dp)
        )
        
        Box(
            modifier = Modifier
                .size(50.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(app.iconColor),
            contentAlignment = Alignment.Center
        ) {
            Icon(app.icon, contentDescription = null, tint = MaterialTheme.colorScheme.onPrimary)
        }
        
        Spacer(modifier = Modifier.width(16.dp))
        
        Column(modifier = Modifier.weight(1f)) {
            Text(app.name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold, maxLines = 1)
            Text(app.category, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        
        Surface(
            shape = RoundedCornerShape(50),
            color = MaterialTheme.colorScheme.primaryContainer
        ) {
            Text(
                text = app.price,
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.primary,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
            )
        }
    }
}

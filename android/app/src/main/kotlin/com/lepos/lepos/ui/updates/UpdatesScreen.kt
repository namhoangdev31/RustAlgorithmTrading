package com.lepos.lepos.ui.updates

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

data class UpdateItemData(
    val id: String,
    val name: String,
    val version: String,
    val size: String,
    val date: String,
    val icon: ImageVector,
    val iconColor: Color,
    val releaseNotes: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun UpdatesScreen(
    onNavigateBack: () -> Unit
) {
    var updates by remember {
        mutableStateOf(
            listOf(
                UpdateItemData(
                    "1",
                    "Task Master",
                    "2.1.0",
                    "45 MB",
                    "Yesterday",
                    Icons.Default.CheckCircle,
                    Color.Blue,
                    "• Added dark mode support\n• Fixed sync issues"
                ),
                UpdateItemData(
                    "2",
                    "EcoLife",
                    "1.4.2",
                    "28 MB",
                    "2 days ago",
                    Icons.Default.Home,
                    Color.Green,
                    "• New carbon footprint calculator"
                ),
                UpdateItemData(
                    "3",
                    "FitPulse",
                    "3.0.1",
                    "120 MB",
                    "Last week",
                    Icons.Default.Favorite,
                    Color.Magenta,
                    "• Bug fixes and stability improvements"
                ),
                UpdateItemData(
                    "4",
                    "Pixel Art",
                    "1.2.0",
                    "65 MB",
                    "Last week",
                    Icons.Default.Star,
                    Color(0xFF6200EE),
                    "• New brush tools\n• Layer management improvements"
                )
            )
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Updates") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    TextButton(onClick = { updates = emptyList() }) {
                        Text("Update All", fontWeight = FontWeight.Bold)
                    }
                }
            )
        }
    ) { paddingValues ->
        if (updates.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        Icons.Default.CheckCircle,
                        contentDescription = null,
                        modifier = Modifier.size(64.dp),
                        tint = Color.Green
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text("All apps are up to date", style = MaterialTheme.typography.titleLarge)
                }
            }
        } else {
            LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
            ) {
                item {
                    Text(
                        "${updates.size} Apps Pending",
                        style = MaterialTheme.typography.titleMedium,
                        color = Color.Gray,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                }

                items(updates) { item ->
                    UpdateItemCard(item = item, onUpdate = {
                        updates = updates.filter { it.id != item.id }
                    })
                }
            }
        }
    }
}

@Composable
fun UpdateItemCard(item: UpdateItemData, onUpdate: () -> Unit) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(
                alpha = 0.5f
            )
        )
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(56.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(item.iconColor),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(item.icon, contentDescription = null, tint = Color.White)
                }

                Spacer(modifier = Modifier.width(16.dp))

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        item.name,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        "v${item.version} • ${item.date}",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.Gray
                    )
                }

                Button(
                    onClick = onUpdate,
                    contentPadding = PaddingValues(horizontal = 16.dp),
                    modifier = Modifier.height(36.dp)
                ) {
                    Text("UPDATE", fontSize = 12.sp)
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            Text(
                item.releaseNotes,
                style = MaterialTheme.typography.bodyMedium,
                color = Color.Gray,
                modifier = Modifier.padding(start = 72.dp)
            )
        }
    }
}

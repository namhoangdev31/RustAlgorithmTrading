package com.lepos.lepos.ui.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CloudDownload
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

data class DownloadHistoryItem(
    val id: String,
    val name: String,
    val date: String,
    val isInstalled: Boolean,
    val color: Color
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DownloadHistoryScreen(
    onNavigateBack: () -> Unit
) {
    val historyItems = remember {
        listOf(
            DownloadHistoryItem("1", "Social Connect", "May 20, 2026", true, Color.Blue),
            DownloadHistoryItem("2", "FitTrack Pro", "April 15, 2026", true, Color.Red),
            DownloadHistoryItem("3", "Puzzle Master", "March 10, 2026", false, Color.Green),
            DownloadHistoryItem("4", "Budget Planner", "February 28, 2026", false, Color(0xFFFF9800)),
            DownloadHistoryItem("5", "Photo Editor X", "January 5, 2026", true, Color(0xFF9C27B0))
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Download History") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            items(historyItems) { item ->
                DownloadHistoryRow(item)
            }
        }
    }
}

@Composable
fun DownloadHistoryRow(item: DownloadHistoryItem) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(48.dp)
                .clip(RoundedCornerShape(8.dp))
                .background(item.color),
            contentAlignment = Alignment.Center
        ) {
             // Placeholder icon
        }
        
        Spacer(modifier = Modifier.width(16.dp))
        
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = item.name,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )
            Text(
                text = "Downloaded on ${item.date}",
                style = MaterialTheme.typography.bodySmall,
                color = Color.Gray
            )
        }
        
        if (item.isInstalled) {
            Button(
                onClick = { /* Open */ },
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                shape = RoundedCornerShape(50),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 0.dp),
                modifier = Modifier.height(32.dp)
            ) {
                Text(
                    text = "OPEN",
                    color = MaterialTheme.colorScheme.primary,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        } else {
            IconButton(onClick = { /* Re-download */ }) {
                Icon(
                    Icons.Filled.CloudDownload,
                    contentDescription = "Re-download",
                    tint = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
}

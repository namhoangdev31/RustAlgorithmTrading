package com.lepos.lepos.ui.miniappdetails

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

data class VersionItem(
    val version: String,
    val date: String,
    val notes: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VersionHistoryScreen(
    appId: String,
    onNavigateBack: () -> Unit
) {
    val scrollBehavior = TopAppBarDefaults.pinnedScrollBehavior()
    
    val versions = listOf(
        VersionItem("2.1.0", "2 days ago", "• Added new dark mode support\n• Fixed crashing issue on startup\n• Performance improvements"),
        VersionItem("2.0.5", "1 week ago", "• Bug fixes and stability improvements"),
        VersionItem("2.0.0", "1 month ago", "• Major update! New UI redesign\n• Added cloud sync feature\n• Improved search functionality"),
        VersionItem("1.5.0", "2 months ago", "• Initial release of pro features")
    )

    Scaffold(
        modifier = Modifier.nestedScroll(scrollBehavior.nestedScrollConnection),
        topBar = {
            TopAppBar(
                title = { Text("Version History") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                scrollBehavior = scrollBehavior
            )
        }
    ) { paddingValues ->
        LazyColumn(
            contentPadding = paddingValues,
            modifier = Modifier.fillMaxSize()
        ) {
            items(versions) { item ->
                VersionHistoryItem(item)
                HorizontalDivider()
            }
        }
    }
}

@Composable
fun VersionHistoryItem(item: VersionItem) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Version ${item.version}",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            
            Text(
                text = item.date,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        
        Text(
            text = item.notes,
            style = MaterialTheme.typography.bodyMedium
        )
    }
}

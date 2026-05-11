package com.lepos.lepos.ui.miniappdetails

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppStorageScreen(
    appId: String,
    onNavigateBack: () -> Unit
) {
    val scrollBehavior = TopAppBarDefaults.pinnedScrollBehavior()

    Scaffold(
        modifier = Modifier.nestedScroll(scrollBehavior.nestedScrollConnection),
        topBar = {
            TopAppBar(
                title = { Text("Storage") },
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
            item {
                StorageSectionMeasure(
                    title = "App Size",
                    value = "48.5 MB"
                )
                HorizontalDivider()
                StorageSectionMeasure(
                    title = "Documents & Data",
                    value = "12.4 MB"
                )
                HorizontalDivider()
                StorageSectionMeasure(
                    title = "Total",
                    value = "60.9 MB",
                    isTotal = true
                )
            }
            
            item {
                Spacer(modifier = Modifier.height(32.dp))
                
                Column(
                    modifier = Modifier.padding(horizontal = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    TextButton(
                        onClick = { /* Clear cache action */ },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Offload App")
                    }
                    
                    TextButton(
                        onClick = { /* Delete data action */ },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = "Delete Documents & Data",
                            color = MaterialTheme.colorScheme.error
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                Text(
                    text = "Offloading the app will free up storage used by the app, but keep its documents and data. Reinstalling the app will place back your data if the app is still available.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(horizontal = 24.dp)
                )
            }
        }
    }
}

@Composable
fun StorageSectionMeasure(
    title: String,
    value: String,
    isTotal: Boolean = false
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.bodyLarge,
            fontWeight = if (isTotal) FontWeight.Medium else FontWeight.Normal
        )
        
        Text(
            text = value,
            style = MaterialTheme.typography.bodyLarge,
            color = if (isTotal) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.onSurfaceVariant,
            fontWeight = if (isTotal) FontWeight.Medium else FontWeight.Normal
        )
    }
}

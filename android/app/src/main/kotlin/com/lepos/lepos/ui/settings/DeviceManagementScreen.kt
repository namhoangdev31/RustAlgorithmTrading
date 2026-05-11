package com.lepos.lepos.ui.settings

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Computer
import androidx.compose.material.icons.filled.Smartphone
import androidx.compose.material.icons.filled.TabletMac
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

data class DeviceItem(
    val name: String,
    val type: String,
    val lastActive: String,
    val isCurrent: Boolean
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DeviceManagementScreen(
    onNavigateBack: () -> Unit
) {
    val scrollBehavior = TopAppBarDefaults.pinnedScrollBehavior()
    
    val currentDevice = DeviceItem(
        name = "Pixel 8", 
        type = "Android", 
        lastActive = "Active now", 
        isCurrent = true
    )
    
    val otherDevices = listOf(
        DeviceItem("iPhone 15 Pro", "iPhone", "Yesterday", false),
        DeviceItem("iPad Air", "iPad", "3 days ago", false),
        DeviceItem("MacBook Pro", "Mac", "1 week ago", false)
    )

    Scaffold(
        modifier = Modifier.nestedScroll(scrollBehavior.nestedScrollConnection),
        topBar = {
            TopAppBar(
                title = { Text("Devices") },
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
                Text(
                    text = "Current Device",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.padding(16.dp)
                )
                DeviceRow(currentDevice)
                HorizontalDivider()
            }
            
            item {
                Text(
                    text = "Other Devices",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.padding(16.dp)
                )
            }
            
            items(otherDevices) { device ->
                DeviceRow(device)
                HorizontalDivider()
            }
            
            item {
                Spacer(modifier = Modifier.height(24.dp))
                
                TextButton(
                    onClick = { /* Sign out logic */ },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "Sign Out All Other Devices",
                        color = MaterialTheme.colorScheme.error
                    )
                }
                
                Text(
                    text = "Signing out will remove access to your account on those devices.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(horizontal = 24.dp, vertical = 8.dp)
                )
            }
        }
    }
}

@Composable
fun DeviceRow(device: DeviceItem) {
    val icon = when(device.type) {
        "Android", "iPhone" -> Icons.Filled.Smartphone
        "iPad" -> Icons.Filled.TabletMac
        "Mac" -> Icons.Filled.Computer
        else -> Icons.Filled.Computer
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.primary,
            modifier = Modifier.size(24.dp)
        )
        
        Spacer(modifier = Modifier.width(16.dp))
        
        Column {
            Text(
                text = device.name,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.Medium
            )
            
            Text(
                text = device.lastActive,
                style = MaterialTheme.typography.bodyMedium,
                color = if (device.isCurrent) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

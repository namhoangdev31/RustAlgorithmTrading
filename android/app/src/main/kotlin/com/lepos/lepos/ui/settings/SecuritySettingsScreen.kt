package com.lepos.lepos.ui.settings

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SecuritySettingsScreen(
    onNavigateBack: () -> Unit
) {
    val scrollBehavior = TopAppBarDefaults.pinnedScrollBehavior()
    var twoFactorEnabled by remember { mutableStateOf(false) }
    var biometricsEnabled by remember { mutableStateOf(true) }

    Scaffold(
        modifier = Modifier.nestedScroll(scrollBehavior.nestedScrollConnection),
        topBar = {
            TopAppBar(
                title = { Text("Security") },
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
                    text = "Login Security",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.padding(16.dp)
                )
                
                ListItem(
                    headlineContent = { Text("Change Password") },
                    trailingContent = { Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, null) },
                    modifier = Modifier.clickable { /* Navigate */ }
                )
                HorizontalDivider()
                
                ListItem(
                    headlineContent = { Text("Two-Factor Authentication") },
                    trailingContent = { 
                        Switch(
                            checked = twoFactorEnabled,
                            onCheckedChange = { twoFactorEnabled = it }
                        ) 
                    }
                )
                HorizontalDivider()
                
                ListItem(
                    headlineContent = { Text("Biometric Login") },
                    trailingContent = { 
                        Switch(
                            checked = biometricsEnabled,
                            onCheckedChange = { biometricsEnabled = it }
                        ) 
                    }
                )
            }
            
            item {
                Text(
                    text = "Activity",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.padding(16.dp)
                )
                
                ListItem(
                    headlineContent = { Text("Recent Login Activity") },
                    trailingContent = { 
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("Safe", color = MaterialTheme.colorScheme.primary)
                            Spacer(Modifier.width(8.dp))
                            Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, null)
                        }
                    },
                    modifier = Modifier.clickable { /* Navigate */ }
                )
            }
            
            item {
                Text(
                    text = "Data Privacy",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.padding(16.dp)
                )
                
                TextButton(
                    onClick = { /* Download data */ },
                    modifier = Modifier.padding(start = 12.dp, bottom = 16.dp)
                ) {
                    Text("Download My Data")
                }
            }
        }
    }
}

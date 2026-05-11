package com.lepos.lepos.ui.profile

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationPreferencesScreen(
    onNavigateBack: () -> Unit
) {
    var notifyUpdates by remember { mutableStateOf(true) }
    var notifyRecommendations by remember { mutableStateOf(true) }
    var notifyOffers by remember { mutableStateOf(false) }
    var notifySecurity by remember { mutableStateOf(true) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Notifications") },
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
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
        ) {
            NotificationSection("App Activity") {
                NotificationSwitch(
                    title = "App Updates",
                    checked = notifyUpdates,
                    onCheckedChange = { notifyUpdates = it }
                )
                NotificationSwitch(
                    title = "Recommendations",
                    checked = notifyRecommendations,
                    onCheckedChange = { notifyRecommendations = it }
                )
            }
            
            Divider(modifier = Modifier.padding(vertical = 16.dp))
            
            NotificationSection("Promotions") {
                NotificationSwitch(
                    title = "Special Offers",
                    checked = notifyOffers,
                    onCheckedChange = { notifyOffers = it }
                )
            }
            
            Divider(modifier = Modifier.padding(vertical = 16.dp))
            
            NotificationSection("Account") {
                NotificationSwitch(
                    title = "Security Alerts",
                    checked = notifySecurity,
                    onCheckedChange = { notifySecurity = it }
                )
            }
            
            Spacer(modifier = Modifier.height(24.dp))
            
            Text(
                "Push notifications allow you to verify your identity and get urgent alerts.",
                style = MaterialTheme.typography.bodySmall,
                color = Color.Gray
            )
        }
    }
}

@Composable
fun NotificationSection(title: String, content: @Composable ColumnScope.() -> Unit) {
    Column {
        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.primary,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(bottom = 8.dp)
        )
        content()
    }
}

@Composable
fun NotificationSwitch(
    title: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(title, style = MaterialTheme.typography.bodyLarge)
        Switch(checked = checked, onCheckedChange = onCheckedChange)
    }
}

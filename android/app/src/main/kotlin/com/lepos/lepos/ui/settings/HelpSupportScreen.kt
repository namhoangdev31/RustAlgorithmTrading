package com.lepos.lepos.ui.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.KeyboardArrowRight
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HelpSupportScreen(onNavigateBack: () -> Unit) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Help & Support") },
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
                .padding(paddingValues)
                .background(MaterialTheme.colorScheme.background)
        ) {
            item {
                SettingsSectionHeader("Common Issues")
                SettingsActionItem(title = "Account & Login", onClick = { /* TODO */ })
                SettingsActionItem(title = "Payments & Refunds", onClick = { /* TODO */ })
                SettingsActionItem(title = "App Installation", onClick = { /* TODO */ })
            }

            item {
                SettingsSectionHeader("Contact Us")
                SettingsActionItem(title = "Email Support", onClick = { /* TODO */ })
                SettingsActionItem(title = "Visit Help Center", onClick = { /* TODO */ })
            }

            item {
                Spacer(modifier = Modifier.height(24.dp))
                Button(
                    onClick = { /* TODO */ },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp)
                ) {
                    Text("Report a Problem")
                }
            }
        }
    }
}

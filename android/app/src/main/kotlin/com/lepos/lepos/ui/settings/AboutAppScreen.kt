package com.lepos.lepos.ui.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.KeyboardArrowRight
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AboutAppScreen(
    onNavigateBack: () -> Unit,
    onNavigateToLegal: (String) -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("About") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
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
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 32.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(
                        modifier = Modifier
                            .size(80.dp)
                            .background(Color.Blue, shape = MaterialTheme.shapes.medium),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("L", color = Color.White, style = MaterialTheme.typography.displayMedium)
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                    Text("Lepos App", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                    Text("Version 1.0.0 (Build 100)", style = MaterialTheme.typography.bodyMedium, color = Color.Gray)
                }
            }

            item {
                SettingsSectionHeader("Legal")
                SettingsActionItem(title = "Terms of Service", onClick = { onNavigateToLegal("terms") })
                SettingsActionItem(title = "Privacy Policy", onClick = { onNavigateToLegal("privacy") })
                SettingsActionItem(title = "Licenses", onClick = { onNavigateToLegal("licenses") })
            }

            item {
                Spacer(modifier = Modifier.height(32.dp))
                Text(
                    text = "Made with ❤️ by the Lepos Team",
                    modifier = Modifier.fillMaxWidth(),
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                    style = MaterialTheme.typography.labelSmall,
                    color = Color.Gray
                )
            }
        }
    }
}

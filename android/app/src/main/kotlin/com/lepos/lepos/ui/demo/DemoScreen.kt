package com.lepos.lepos.ui.demo

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.lepos.lepos.designtokens.DesignTokens

/**
 * Demo screen to verify Material 3 Expressive theme
 *
 * This replaces the Liquid Glass demo with Material 3 components
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DemoScreen() {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Lepos - Material 3") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary
                )
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(DesignTokens.Spacing.md.dp),
            verticalArrangement = Arrangement.spacedBy(DesignTokens.Spacing.md.dp)
        ) {
            // Header
            Text(
                text = "Welcome to Lepos",
                style = MaterialTheme.typography.displayMedium,
                color = MaterialTheme.colorScheme.onBackground
            )

            Text(
                text = "Material 3 Expressive Design",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface
            )

            Spacer(modifier = Modifier.height(DesignTokens.Spacing.lg.dp))

            // Card with elevation (replaces glass effect)
            Card(
                modifier = Modifier.fillMaxWidth(),
                elevation = CardDefaults.cardElevation(
                    defaultElevation = 4.dp
                )
            ) {
                Column(
                    modifier = Modifier.padding(DesignTokens.Spacing.md.dp)
                ) {
                    Text(
                        text = "Material 3 Card",
                        style = MaterialTheme.typography.titleLarge
                    )
                    Spacer(modifier = Modifier.height(DesignTokens.Spacing.sm.dp))
                    Text(
                        text = "This uses native Material 3 elevation instead of blur effects.",
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }

            // Button with Material 3 styling
            Button(
                onClick = { /* TODO */ },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Material 3 Button")
            }

            OutlinedButton(
                onClick = { /* TODO */ },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Outlined Button")
            }

            // Surface with tonal color
            Surface(
                modifier = Modifier.fillMaxWidth(),
                tonalElevation = 2.dp,
                shape = MaterialTheme.shapes.medium
            ) {
                Text(
                    text = "Tonal Surface - Material 3 alternative to glass morphism",
                    modifier = Modifier.padding(DesignTokens.Spacing.md.dp),
                    style = MaterialTheme.typography.bodyMedium
                )
            }
        }
    }
}

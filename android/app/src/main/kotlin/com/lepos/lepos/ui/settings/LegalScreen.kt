package com.lepos.lepos.ui.settings

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LegalScreen(
    type: String, // "terms", "privacy", "licenses"
    onNavigateBack: () -> Unit
) {
    val title = when (type) {
        "terms" -> "Terms of Service"
        "privacy" -> "Privacy Policy"
        "licenses" -> "Licenses"
        else -> "Legal"
    }
    
    val content = when (type) {
        "terms" -> """
            Terms of Service
            
            1. Acceptance of Terms
            By accessing and using this application, you accept and agree to be bound by the terms and provision of this agreement.
            
            2. Use License
            Permission is granted to temporarily download one copy of the materials (information or software) on Lepos App for personal, non-commercial transitory viewing only.
            
            3. Disclaimer
            The materials on Lepos App are provided "as is". Lepos makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties.
        """.trimIndent()
        "privacy" -> """
            Privacy Policy
            
            1. Information Collection
            We collect information from you when you register on our site, place an order, subscribe to a newsletter or enter information on our site.
            
            2. Use of Information
            Any of the information we collect from you may be used to personalize your experience, improve our website, improve customer service, or process transactions.
            
            3. Data Protection
            We implement a variety of security measures to maintain the safety of your personal information.
        """.trimIndent()
        "licenses" -> """
             Open Source Licenses
            
            - SwiftUI
            - Jetpack Compose
            - Kotlin Standard Library
            - Swift Standard Library
        """.trimIndent()
        else -> "Content not found."
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(title) },
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
            Text(content, style = MaterialTheme.typography.bodyMedium)
        }
    }
}

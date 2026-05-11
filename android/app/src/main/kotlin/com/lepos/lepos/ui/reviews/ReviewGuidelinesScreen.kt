package com.lepos.lepos.ui.reviews

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Cancel
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReviewGuidelinesScreen(
    onNavigateBack: () -> Unit
) {
    val scrollBehavior = TopAppBarDefaults.pinnedScrollBehavior()

    Scaffold(
        modifier = Modifier.nestedScroll(scrollBehavior.nestedScrollConnection),
        topBar = {
            TopAppBar(
                title = { Text("Guidelines") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                scrollBehavior = scrollBehavior
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .padding(paddingValues)
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(24.dp)
        ) {
            Text(
                text = "Review Guidelines",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Text(
                text = "Help keep our community helpful and safe by following these guidelines when writing reviews.",
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            
            Spacer(modifier = Modifier.height(32.dp))
            
            GuidelineItem(
                icon = Icons.Default.CheckCircle,
                iconColor = Color(0xFF4CAF50), // Green
                title = "Be Helpful",
                description = "Focus on the app's features, functionality, and your personal experience."
            )
            
            Spacer(modifier = Modifier.height(24.dp))
            
            GuidelineItem(
                icon = Icons.Default.CheckCircle,
                iconColor = Color(0xFF4CAF50), // Green
                title = "Be Specific",
                description = "Explain what you liked or didn't like. Details help developers improve their app."
            )
            
            Spacer(modifier = Modifier.height(24.dp))
            
    GuidelineItem(
        icon = Icons.Filled.Cancel,
        iconColor = MaterialTheme.colorScheme.error,
        title = "No Spam",
        description = "Avoid posting advertisements, promotional material, or repetitive content."
    )
    
    Spacer(modifier = Modifier.height(24.dp))
    
    GuidelineItem(
        icon = Icons.Filled.Cancel,
        iconColor = MaterialTheme.colorScheme.error,
        title = "No Hate Speech",
        description = "We have zero tolerance for hate speech, harassment, or offensive language."
    )
    
    Spacer(modifier = Modifier.height(32.dp))
    
    Text(
        text = "Reviews that violate these guidelines may be removed.",
        style = MaterialTheme.typography.bodySmall,
        color = MaterialTheme.colorScheme.outline
    )
}
}
}

@Composable
fun GuidelineItem(
icon: ImageVector,
iconColor: Color,
title: String,
description: String
) {
Row(verticalAlignment = Alignment.Top) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = iconColor,
            modifier = Modifier.size(24.dp).padding(top = 2.dp)
        )
        
        Spacer(modifier = Modifier.width(16.dp))
        
        Column {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            
            Spacer(modifier = Modifier.height(4.dp))
            
            Text(
                text = description,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

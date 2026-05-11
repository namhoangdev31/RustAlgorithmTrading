package com.lepos.lepos.ui.reviews

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.outlined.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WriteReviewScreen(
    appId: String,
    onNavigateBack: () -> Unit
) {
    var rating by remember { mutableIntStateOf(0) }
    var title by remember { mutableStateOf("") }
    var review by remember { mutableStateOf("") }
    var isSubmitting by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Write a Review") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.Close, contentDescription = "Cancel")
                    }
                },
                actions = {
                    if (isSubmitting) {
                         CircularProgressIndicator(modifier = Modifier.size(24.dp))
                    } else {
                        TextButton(
                            onClick = {
                                isSubmitting = true
                                // Mock Submission
                                // In real app, launch coroutine/viewmodel
                                onNavigateBack() // Mock success close
                            },
                            enabled = rating > 0 && title.isNotBlank()
                        ) {
                            Text("Submit", fontWeight = FontWeight.Bold)
                        }
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
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "Tap to Rate",
                style = MaterialTheme.typography.bodyMedium,
                color = Color.Gray
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Star Rating
            Row(
                horizontalArrangement = Arrangement.Center
            ) {
                for (i in 1..5) {
                    Icon(
                        if (i <= rating) Icons.Filled.Star else Icons.Outlined.Star,
                        contentDescription = "$i Star",
                        modifier = Modifier
                            .size(48.dp)
                            .clickable { rating = i },
                        tint = Color(0xFFFF9800)
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(32.dp))
            
            // Title
            OutlinedTextField(
                value = title,
                onValueChange = { title = it },
                label = { Text("Title") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Review
            OutlinedTextField(
                value = review,
                onValueChange = { review = it },
                label = { Text("Review (Optional)") },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(150.dp),
                minLines = 5,
                maxLines = 10
            )
        }
    }
}

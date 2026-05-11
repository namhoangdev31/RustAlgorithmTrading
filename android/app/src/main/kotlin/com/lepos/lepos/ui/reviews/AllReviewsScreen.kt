package com.lepos.lepos.ui.reviews

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

data class ReviewItemData(
    val id: String,
    val author: String,
    val rating: Int,
    val date: String,
    val title: String,
    val content: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AllReviewsScreen(
    appId: String,
    onNavigateBack: () -> Unit
) {
    val reviews = listOf(
        ReviewItemData("1", "EcoFan99", 5, "2 days ago", "Life changing!", "This app has completely changed how I view my daily habits. Highly recommended!"),
        ReviewItemData("2", "GreenUser", 4, "4 days ago", "Incredible impact", "The UI is beautiful and the tracking is scary accurate. I've already reduced my weekly carbon output by 15% just by making small changes recommended by the app."),
        ReviewItemData("3", "NatureLover", 5, "1 week ago", "Best in class", "I've tried many apps like this, but this one is by far the best. Smooth animation, great data visualization."),
        ReviewItemData("4", "CityDweller", 3, "2 weeks ago", "Good but needs dark mode", "Great functionality but really needs a true dark mode for night usage."),
        ReviewItemData("5", "Techie", 4, "3 weeks ago", "Solid app", "Does what it says. No bugs found so far."),
        ReviewItemData("6", "Newbie", 5, "1 month ago", "Simple and effective", "Very easy to use, even for non-tech savvy people.")
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Ratings & Reviews") },
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
        ) {
            // Sort Chips (Mock)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                 FilterChip(
                     selected = true,
                     onClick = { },
                     label = { Text("Most Recent") }
                 )
                 FilterChip(
                     selected = false,
                     onClick = { },
                     label = { Text("Most Helpful") }
                 )
            }
            
            LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                items(reviews) { review ->
                    ReviewCard(review)
                }
            }
        }
    }
}

@Composable
fun ReviewCard(review: ReviewItemData) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(review.title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Text(review.date, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            
            Spacer(modifier = Modifier.height(4.dp))
            
            Row(verticalAlignment = Alignment.CenterVertically) {
                repeat(5) { index ->
                    Icon(
                        Icons.Default.Star, 
                        contentDescription = null, 
                        tint = if (index < review.rating) Color(0xFFFF9800) else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.3f),
                        modifier = Modifier.size(14.dp)
                    )
                }
                Spacer(modifier = Modifier.width(8.dp))
                Text(review.author, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(review.content, style = MaterialTheme.typography.bodyMedium)
        }
    }
}

package com.lepos.lepos.ui.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.MoreHoriz
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

data class MyReviewItem(
    val id: String,
    val appName: String,
    val appIconColor: Color,
    val rating: Int,
    val date: String,
    val comment: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MyReviewsScreen(
    onNavigateBack: () -> Unit
) {
    val reviews = listOf(
        MyReviewItem("1", "EcoTrack Pro", MaterialTheme.colorScheme.primary, 5, "2 days ago", "Amazing app! Helped me reduce my carbon footprint significantly."),
        MyReviewItem("2", "Pixel Art", MaterialTheme.colorScheme.secondary, 4, "1 week ago", "Great tools, but needs more layers in the free version."), // Purple
        MyReviewItem("3", "Zen Space", MaterialTheme.colorScheme.tertiary, 5, "2 weeks ago", "Visuals are stunning. Very relaxing.") // Pink
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("My Reviews") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { paddingValues ->
        if (reviews.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize().padding(paddingValues), contentAlignment = Alignment.Center) {
                Text("No reviews yet", color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        } else {
            LazyColumn(
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                modifier = Modifier.padding(paddingValues)
            ) {
                items(reviews) { review ->
                    ReviewCard(review)
                }
            }
        }
    }
}

@Composable
fun ReviewCard(review: MyReviewItem) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(review.appIconColor),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = review.appName.take(1),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                }
                
                Spacer(modifier = Modifier.width(12.dp))
                
                Column(modifier = Modifier.weight(1f)) {
                    Text(review.appName, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                    Text(review.date, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                
                IconButton(onClick = {}) {
                    Icon(Icons.Default.MoreHoriz, contentDescription = "More", tint = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Row(horizontalArrangement = Arrangement.spacedBy(2.dp)) {
                repeat(5) { index ->
                    Icon(
                        Icons.Default.Star,
                        contentDescription = null,
                        tint = if (index < review.rating) Color(0xFFFF9800) else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.3f),
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(review.comment, style = MaterialTheme.typography.bodyMedium)
        }
    }
}

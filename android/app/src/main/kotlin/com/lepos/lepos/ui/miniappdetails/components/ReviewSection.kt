package com.lepos.lepos.ui.miniappdetails.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun ReviewSection(
    onWriteReview: () -> Unit,
    onSeeAllReviews: () -> Unit
) {
    Column(modifier = Modifier.padding(16.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Ratings & Reviews", fontSize = 20.sp, fontWeight = FontWeight.Bold)
            Text(
                text = "See All", 
                fontSize = 16.sp, 
                color = Color.Blue,
                modifier = Modifier.clickable { onSeeAllReviews() }
            )
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            // Big Score
            Column {
                Text("4.8", fontSize = 56.sp, fontWeight = FontWeight.Bold)
                Text("out of 5", fontSize = 14.sp, color = Color.Gray, fontWeight = FontWeight.Bold)
            }
            
            // Bars (Simplified visual)
            Column(
                modifier = Modifier
                    .weight(1f)
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                RatingRow(stars = 5, percent = 0.9f)
                RatingRow(stars = 4, percent = 0.1f)
                RatingRow(stars = 3, percent = 0.05f)
                RatingRow(stars = 2, percent = 0.02f)
                RatingRow(stars = 1, percent = 0.03f)
            }
            
            Column(horizontalAlignment = Alignment.End) {
                 Spacer(modifier = Modifier.height(60.dp))
                 Text("2,432 Ratings", fontSize = 10.sp, color = Color.Gray)
            }
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        OutlinedButton(
            onClick = onWriteReview,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(8.dp)
        ) {
            Icon(Icons.Default.Star, contentDescription = null, modifier = Modifier.size(18.dp))
            Spacer(modifier = Modifier.width(8.dp))
            Text("Write a Review")
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Review Card
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(Color.LightGray.copy(alpha = 0.2f))
                .padding(16.dp)
        ) {
            Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                Text("Incredible impact", fontWeight = FontWeight.Bold)
                Text("4d ago", fontSize = 12.sp, color = Color.Gray)
            }
            Row {
                repeat(5) {
                    Icon(Icons.Default.Star, contentDescription = null, tint = Color(0xFFFFA500), modifier = Modifier.size(12.dp))
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                "The UI is beautiful and the tracking is scary accurate. I've already reduced my weekly carbon output by 15% just by making small changes recommended by the app.",
                style = MaterialTheme.typography.bodyMedium,
                maxLines = 4
            )
        }
    }
}

@Composable
fun RatingRow(stars: Int, percent: Float) {
    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.height(6.dp)) {
        Spacer(modifier = Modifier.weight(1f)) // pushes bar to right
        Box(
            modifier = Modifier
                .height(4.dp)
                .width(100.dp) // Fixed width for bar container
                .clip(RoundedCornerShape(2.dp))
                .background(Color.LightGray.copy(alpha = 0.3f))
        ) {
            Box(
                modifier = Modifier
                    .fillMaxHeight()
                    .fillMaxWidth(percent)
                    .background(Color.Gray)
            )
        }
    }
}

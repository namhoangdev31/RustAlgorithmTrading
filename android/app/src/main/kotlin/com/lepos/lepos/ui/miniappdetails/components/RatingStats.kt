package com.lepos.lepos.ui.miniappdetails.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.horizontalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Folder
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.StarHalf
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

import com.lepos.lepos.domain.model.bundle.*

@Composable
fun RatingStats(stats: BundleStats?) {
    val ratingValue = stats?.rating ?: 0.0
    val ratingCount = stats?.downloadCount ?: 0 // Using downloadCount as proxy for now or 0
    val ageRating = "4+" // Hardcoded for now but could come from metadata
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .horizontalScroll(rememberScrollState())
            .padding(vertical = 12.dp, horizontal = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(0.dp) // Manual spacing via weights or padding if needed, sticking to design
    ) {
         // Ratings
         Column(
             modifier = Modifier.widthIn(min = 90.dp),
             horizontalAlignment = Alignment.CenterHorizontally
         ) {
              Row(verticalAlignment = Alignment.Bottom) {
                 val formattedRating = if (ratingValue % 1.0 == 0.0) ratingValue.toInt().toString() else ratingValue.toString()
                 Text(formattedRating, fontSize = 22.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
             }
             Row(horizontalArrangement = Arrangement.spacedBy(0.dp)) {
                 repeat(4) {
                     Icon(
                         imageVector = Icons.Default.Star,
                         contentDescription = null,
                         tint = MaterialTheme.colorScheme.onSurfaceVariant,
                         modifier = Modifier.size(12.dp)
                     )
                 }
                 Icon(
                     imageVector = Icons.Default.StarHalf,
                     contentDescription = null,
                     tint = MaterialTheme.colorScheme.onSurfaceVariant,
                     modifier = Modifier.size(12.dp)
                 )
             }
             Text("$ratingCount Downloads", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
         }
         
         DividerVertical()
         
         // Age
         Column(
             modifier = Modifier.widthIn(min = 90.dp),
             horizontalAlignment = Alignment.CenterHorizontally
         ) {
             Text("4+", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
             Text("AGE", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurfaceVariant)
             Text("Years Old", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
         }
         
         DividerVertical()
         
         // Category
         Column(
             modifier = Modifier.widthIn(min = 90.dp),
             horizontalAlignment = Alignment.CenterHorizontally
         ) {
             Icon(Icons.Default.Folder, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(24.dp))
             Text("Productivity", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(top = 4.dp))
         }
         
         DividerVertical()
         
         // Language
         Column(
             modifier = Modifier.widthIn(min = 90.dp),
             horizontalAlignment = Alignment.CenterHorizontally
         ) {
             Text("EN", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
             Text("Language", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurfaceVariant)
             Text("+ 12 More", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
         }
    }
}

@Composable
fun DividerVertical() {
    Box(
        modifier = Modifier
            .height(30.dp)
            .width(1.dp)
            .background(MaterialTheme.colorScheme.outlineVariant)
            .padding(horizontal = 10.dp) // visual spacing logic handled by container usually
    )
}

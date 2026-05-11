package com.lepos.lepos.ui.profile.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.DirectionsCar // Ride
import androidx.compose.material.icons.filled.LocalMovies // Cinema
import androidx.compose.material.icons.filled.Restaurant // Foodie
import androidx.compose.material.icons.filled.Widgets
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun FavoriteMiniApps() {
    Column(
        modifier = Modifier
            .padding(16.dp)
            .background(Color.White, RoundedCornerShape(24.dp))
            .padding(24.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "FAVORITE MINI APPS",
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.Bold,
                color = Color.Gray,
                letterSpacing = 1.sp
            )
            
            Icon(Icons.Default.Widgets, contentDescription = null, tint = Color.Gray)
        }
        
        Spacer(modifier = Modifier.height(24.dp))
        
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            MiniAppIcon("Foodie", Icons.Default.Restaurant, Color(0xFFFF9800))
            MiniAppIcon("Ride", Icons.Default.DirectionsCar, Color(0xFF2196F3))
            MiniAppIcon("Cinema", Icons.Default.LocalMovies, Color(0xFF9C27B0))
            MiniAppIcon("Add", Icons.Default.Add, Color.Gray, isAdd = true)
        }
    }
}

@Composable
fun MiniAppIcon(
    name: String,
    icon: ImageVector,
    color: Color,
    isAdd: Boolean = false
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Surface(
            modifier = Modifier.size(60.dp),
            shape = CircleShape,
            color = if (isAdd) MaterialTheme.colorScheme.surfaceVariant else color.copy(alpha = 0.1f)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = name,
                tint = if (isAdd) Color.Gray else color,
                modifier = Modifier.padding(16.dp)
            )
        }
        
        Text(
            text = name,
            style = MaterialTheme.typography.labelMedium,
            color = Color.Gray
        )
    }
}

package com.lepos.lepos.ui.search.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@Composable
fun SearchQuickCategories() {
    Column(modifier = Modifier.padding(vertical = 16.dp)) {
        Text(
            text = "Quick Categories",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
        )
        
        Column(
            modifier = Modifier.padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Large Dining Card
                CategoryCard(
                    name = "Dining",
                    icon = Icons.Filled.Restaurant,
                    backgroundColor = Color.Cyan.copy(alpha = 0.2f),
                    iconColor = Color.Cyan,
                    modifier = Modifier
                        .weight(1f)
                        .height(160.dp)
                )
                
                // Travel Card
                CategoryCard(
                    name = "Travel",
                    icon = Icons.Filled.Flight,
                    backgroundColor = Color(0xFFFF9800).copy(alpha = 0.2f),
                    iconColor = Color(0xFFFF9800),
                    modifier = Modifier
                        .weight(1f)
                        .height(70.dp)
                )
            }
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Games Card
                CategoryCard(
                    name = "Games",
                    icon = Icons.Filled.SportsEsports,
                    backgroundColor = Color(0xFF9C27B0).copy(alpha = 0.2f),
                    iconColor = Color(0xFF9C27B0),
                    modifier = Modifier
                        .weight(1f)
                        .height(70.dp)
                )
                
                // Leisure Card
                CategoryCard(
                    name = "Leisure",
                    icon = Icons.Filled.Park, // Placeholder for leaf
                    backgroundColor = Color.Green.copy(alpha = 0.2f),
                    iconColor = Color.Green,
                    modifier = Modifier
                        .weight(1f)
                        .height(70.dp)
                )
            }
        }
    }
}

@Composable
fun CategoryCard(
    name: String,
    icon: ImageVector,
    backgroundColor: Color,
    iconColor: Color,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(20.dp),
        color = backgroundColor
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(20.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Icon(
                imageVector = icon,
                contentDescription = name,
                tint = iconColor,
                modifier = Modifier.size(32.dp)
            )
            
            Text(
                text = name,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )
        }
    }
}

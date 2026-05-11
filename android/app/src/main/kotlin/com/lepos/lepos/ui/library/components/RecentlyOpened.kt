package com.lepos.lepos.ui.library.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Flight // Travel
import androidx.compose.material.icons.filled.LocalDining // Dining
import androidx.compose.material.icons.filled.Movie // Media
import androidx.compose.material.icons.filled.ShoppingBag // Retail
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@Composable
fun RecentlyOpened(onAppClick: (String) -> Unit) {
    Column(modifier = Modifier.padding(top = 24.dp)) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = "Recently Opened",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "See All",
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.primary
            )
        }
        
        val items = listOf(
            Triple("Dining", Icons.Filled.LocalDining, MaterialTheme.colorScheme.tertiary),
            Triple("Travel", Icons.Filled.Flight, MaterialTheme.colorScheme.primary),
            Triple("Retail", Icons.Filled.ShoppingBag, MaterialTheme.colorScheme.secondary),
            Triple("Media", Icons.Filled.Movie, MaterialTheme.colorScheme.error)
        )
        
        LazyRow(
            contentPadding = PaddingValues(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            items(items.size) { index ->
                val (name, icon, color) = items[index]
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Surface(
                        modifier = Modifier.size(70.dp),
                        shape = CircleShape,
                        color = color.copy(alpha = 0.1f),
                        onClick = { onAppClick(name) }
                    ) {
                        Icon(
                            imageVector = icon,
                            contentDescription = name,
                            tint = color,
                            modifier = Modifier.padding(16.dp)
                        )
                    }
                    Text(
                        text = name,
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

package com.lepos.lepos.ui.wishlist

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

data class WishlistItemData(
    val id: String,
    val name: String,
    val category: String,
    val iconColor: Color,
    val rating: Double
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WishlistScreen(
    onAppClick: (String) -> Unit
) {
    var wishlistItems by remember {
        mutableStateOf(
            listOf(
                WishlistItemData("1", "Zen Space", "Health", Color(0xFFE91E63), 4.9), // Pink
                WishlistItemData("2", "Pixel Art", "Design", Color(0xFF9C27B0), 4.7), // Purple
                WishlistItemData("3", "Travel Mate", "Travel", Color.Cyan, 4.4),
                WishlistItemData("4", "CryptoWatch", "Finance", Color(0xFFFF9800), 4.3) // Orange
            )
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Wishlist") }
            )
        }
    ) { paddingValues ->
        if (wishlistItems.isEmpty()) {
            com.lepos.lepos.ui.components.EmptyState(
                icon = Icons.Default.Favorite,
                title = "No Saved Apps",
                message = "Apps you add to your wishlist will appear here."
            )
        } else {
            LazyVerticalGrid(
                columns = GridCells.Adaptive(minSize = 160.dp),
                contentPadding = PaddingValues(16.dp),
                horizontalArrangement = Arrangement.spacedBy(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
            ) {
                items(wishlistItems) { item ->
                    WishlistCard(item = item, onClick = { onAppClick(item.id) }, onRemove = {
                        wishlistItems = wishlistItems.filter { it.id != item.id }
                    })
                }
            }
        }
    }
}

@Composable
fun WishlistCard(item: WishlistItemData, onClick: () -> Unit, onRemove: () -> Unit) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)),
        modifier = Modifier.clickable(onClick = onClick)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.Top) {
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(item.iconColor),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = item.name.take(1),
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onPrimary,
                        fontWeight = FontWeight.Bold
                    )
                }
                
                Spacer(modifier = Modifier.weight(1f))
                
                IconButton(onClick = onRemove, modifier = Modifier.size(32.dp)) {
                    Icon(
                        Icons.Default.Favorite,
                        contentDescription = "Remove",
                        tint = MaterialTheme.colorScheme.error
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            Text(item.name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, maxLines = 1)
            Text(item.category, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            
            Spacer(modifier = Modifier.height(4.dp))
            
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Star, contentDescription = null, tint = Color(0xFFFFC107), modifier = Modifier.size(12.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("${item.rating}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            Button(
                onClick = onClick, // Navigate to details to get
                modifier = Modifier.fillMaxWidth().height(36.dp),
                contentPadding = PaddingValues(0.dp)
            ) {
                Text("GET", fontSize = 12.sp)
            }
        }
    }
}

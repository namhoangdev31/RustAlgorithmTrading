package com.lepos.lepos.ui.home.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

data class CollectionData(val title: String, val subtitle: String, val color: Color)

@Composable
fun TopCollections(onCollectionClick: (String, String) -> Unit) {
    val collections = listOf(
        CollectionData("Essential FinTech\nfor 2024", "Manage everything from crypto to classic banking.", MaterialTheme.colorScheme.primaryContainer),
        CollectionData("Weekend Vibes", "The best food delivery apps.", MaterialTheme.colorScheme.tertiaryContainer),
        CollectionData("Learn New Skills", "Education apps for everyone.", MaterialTheme.colorScheme.secondaryContainer)
    )
    
    Column(modifier = Modifier.padding(bottom = 24.dp)) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Top Collections",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            TextButton(onClick = { 
                onCollectionClick("top_collections", "Top Collections")
            }) {
                Text("See All")
            }
        }
        
        LazyRow(
            contentPadding = PaddingValues(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            items(collections) { item ->
                Column(modifier = Modifier
                    .width(220.dp)
                    .clickable { 
                         onCollectionClick(item.title, "Featured Collection")
                    }
                ) {
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(140.dp),
                        shape = RoundedCornerShape(16.dp),
                        color = item.color.copy(alpha = 0.8f)
                    ) {
                        // Image placeholder
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "CURATED",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = item.title,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold,
                        maxLines = 2,
                        minLines = 2,
                        overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                    )
                     Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = item.subtitle,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 2,
                        minLines = 2,
                         overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                    )
                }
            }
        }
    }
}

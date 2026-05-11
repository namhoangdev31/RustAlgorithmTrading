package com.lepos.lepos.ui.library.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Brush
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.CurrencyBitcoin
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Flight
import androidx.compose.material.icons.filled.Spa
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

data class AppItem(
    val name: String,
    val version: String,
    val size: String,
    val icon: ImageVector,
    val color: Color
)

@Composable
fun AllAppsList(onAppClick: (String) -> Unit) {
    val apps = listOf(
        AppItem("EcoTrack Pro", "2.1.0", "45 MB", Icons.Filled.Spa, MaterialTheme.colorScheme.primary), // leaf -> Spa
        AppItem("Pixel Art", "1.0.5", "120 MB", Icons.Filled.Brush, MaterialTheme.colorScheme.secondary), // paintbrush -> Brush
        AppItem("CryptoWatch", "3.2.1", "15 MB", Icons.Filled.CurrencyBitcoin, MaterialTheme.colorScheme.tertiary), // bitcoinsign -> CurrencyBitcoin
        AppItem("Zen Space", "1.2.0", "88 MB", Icons.Filled.Favorite, MaterialTheme.colorScheme.error), // heart -> Favorite
        AppItem("Travel Mate", "2.0.0", "60 MB", Icons.Filled.Flight, MaterialTheme.colorScheme.secondaryContainer), // airplane -> Flight
        AppItem("Quick Notes", "1.1.2", "10 MB", Icons.Filled.Description, MaterialTheme.colorScheme.tertiaryContainer) // note.text -> Description
    )

    Column(modifier = Modifier.padding(vertical = 16.dp)) {
        Text(
            "All Apps",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
        )
        
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            modifier = Modifier.padding(horizontal = 16.dp)
        ) {
            Column {
                apps.forEachIndexed { index, app ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onAppClick(app.name) }
                            .padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(app.color),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(app.icon, contentDescription = null, tint = MaterialTheme.colorScheme.onPrimaryContainer)
                        }
                        
                        Spacer(modifier = Modifier.width(12.dp))
                        
                        Column(modifier = Modifier.weight(1f)) {
                            Text(app.name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                            Text("Ver ${app.version} • ${app.size}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        
                        Icon(Icons.Filled.ChevronRight, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    if (index < apps.lastIndex) {
                        Divider(modifier = Modifier.padding(start = 68.dp))
                    }
                }
            }
        }
    }
}

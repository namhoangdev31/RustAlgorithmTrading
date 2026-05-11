package com.lepos.lepos.ui.search.components

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowUpward
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

@Composable
fun SearchSuggestions(query: String) {
    val suggestions = when {
        query.lowercase().startsWith("foo") -> listOf(
            "Food delivery",
            "Food recipes",
            "Football scores",
            "Footwear fashion",
            "Food near me"
        )
        query.lowercase().startsWith("eco") -> listOf(
            "Eco-friendly travel",
            "Eco products",
            "Economy news"
        )
        query.isNotEmpty() -> listOf(
            "$query apps",
            "$query services",
            "$query near me"
        )
        else -> emptyList()
    }
    
    Column {
        suggestions.forEach { suggestion ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Filled.Search,
                    contentDescription = null,
                    tint = Color.Gray,
                    modifier = Modifier.size(20.dp)
                )
                
                Spacer(modifier = Modifier.width(16.dp))
                
                Text(
                    text = suggestion,
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.weight(1f)
                )
                
                Icon(
                    imageVector = Icons.Filled.ArrowUpward,
                    contentDescription = null,
                    tint = Color.Gray.copy(alpha = 0.5f),
                    modifier = Modifier.size(16.dp)
                )
            }
            
            HorizontalDivider()
        }
    }
}

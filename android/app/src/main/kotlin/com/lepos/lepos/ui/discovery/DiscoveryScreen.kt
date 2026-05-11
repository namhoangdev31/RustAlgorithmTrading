package com.lepos.lepos.ui.discovery

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.lepos.lepos.ui.discovery.components.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DiscoveryScreen(
    onTopChartsClick: () -> Unit,
    onCategoryClick: (String, String) -> Unit,
    onItemClick: (String) -> Unit
) {
    Scaffold { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
            ) {
                DiscoveryHeader()
                
                FeaturedStory(onClick = { onItemClick("featured_story") })
                
                DiscoveryAppsWeLove(onAppClick = onItemClick)
                
                // Top Charts Button
                Card(
                    onClick = onTopChartsClick,
                    shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp),
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp).fillMaxWidth()
                ) {
                    androidx.compose.foundation.layout.Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
                    ) {
                        androidx.compose.material3.Text(
                            "Top Charts",
                            style = androidx.compose.material3.MaterialTheme.typography.titleMedium,
                            fontWeight = androidx.compose.ui.text.font.FontWeight.Bold
                        )
                        androidx.compose.foundation.layout.Spacer(modifier = Modifier.weight(1f))
                        androidx.compose.material3.Icon(
                            androidx.compose.material.icons.Icons.Default.ArrowForward,
                            contentDescription = null
                        )
                    }
                }
                
                Categories(onCategoryClick = onCategoryClick)
                
                TrendingThisWeek(onAppClick = onItemClick)
                
                // Bottom spacing
                Box(modifier = Modifier.height(50.dp))
            }
        }
    }
}

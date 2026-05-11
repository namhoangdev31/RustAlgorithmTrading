package com.lepos.lepos.ui.activity

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.lepos.lepos.ui.activity.components.ActivityHeader
import com.lepos.lepos.ui.activity.components.ActivitySectionHeader
import com.lepos.lepos.ui.activity.components.MiniAppActivityCard
import com.lepos.lepos.ui.activity.components.SystemActivityCard

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ActivityScreen(
    onNavigateBack: () -> Unit
) {
    Scaffold(
        containerColor = Color(0xFFF2F2F7), // System Grouped Background
        topBar = {
            // Custom top bar handling if needed, but we use a custom header in the scrollable content
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
                .padding(bottom = 20.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // Filters
            var selectedFilter by remember { mutableStateOf("All") }
            val filters = listOf("All", "Unread", "Mentions", "System")

            LazyRow(
                contentPadding = PaddingValues(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.padding(top = 8.dp)
            ) {
                items(filters) { filter ->
                    FilterChip(
                        selected = selectedFilter == filter,
                        onClick = { selectedFilter = filter },
                        label = { Text(filter) },
                        leadingIcon = if (selectedFilter == filter) {
                            {
                                Icon(
                                    Icons.Default.Check,
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                        } else null
                    )
                }
            }

            // Header
            ActivityHeader(onReadAllClick = {})

            // Section: Last 24 Hours
            ActivitySectionHeader(title = "Last 24 Hours")

            SystemActivityCard(
                isUnread = true,
                onUpdateClick = {}
            )

            MiniAppActivityCard(
                appName = "Food Dash",
                description = "Your lunch is arriving in 5 mins.",
                timeAgo = "12m ago",
                iconColor = Color(0xFFA4C639), // Android Greenish
                actionTitle = "TRACK",
                isUnread = true,
                onActionClick = {}
            )

            MiniAppActivityCard(
                appName = "Fitness Hub",
                description = "5-day activity streak reached!",
                timeAgo = "2h ago",
                iconColor = Color(0xFF00C7BE), // Mint
                actionTitle = "VIEW",
                isUnread = true,
                onActionClick = {}
            )

            // Section: Earlier
            ActivitySectionHeader(title = "Earlier")

            MiniAppActivityCard(
                appName = "Cloud Sync",
                description = "Backup for 4 mini-apps complete.",
                timeAgo = "Yesterday",
                iconColor = Color(0xFF5AC8FA), // Light Blue
                actionTitle = "OPEN",
                isUnread = false,
                onActionClick = {}
            )
        }
    }
}

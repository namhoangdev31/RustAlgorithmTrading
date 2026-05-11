package com.lepos.lepos.ui.notifications

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp

data class NotificationItem(
    val id: String,
    val title: String,
    val message: String,
    val time: String,
    val isRead: Boolean,
    val type: String // "update", "promo", "system"
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationInboxScreen(
    onNavigateBack: () -> Unit,
    onNavigateToDetail: (String) -> Unit
) {
    val scrollBehavior = TopAppBarDefaults.pinnedScrollBehavior()
    
    val notifications = listOf(
        NotificationItem("1", "New Update Available", "LeposApp v2.1 is now available with dark mode support.", "2h ago", false, "update"),
        NotificationItem("2", "Welcome to LeposApp!", "Thanks for joining our community. Check out our getting started guide.", "1d ago", true, "system"),
        NotificationItem("3", "Sale Ends Soon", "50% off on all pro subscriptions. Don't miss out!", "2d ago", true, "promo"),
        NotificationItem("4", "Security Alert", "New login detected from Mac Device.", "3d ago", true, "system")
    )

    Scaffold(
        modifier = Modifier.nestedScroll(scrollBehavior.nestedScrollConnection),
        topBar = {
            TopAppBar(
                title = { Text("Notifications") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    TextButton(onClick = { /* Mark all read */ }) {
                        Text("Mark all read")
                    }
                },
                scrollBehavior = scrollBehavior
            )
        }
    ) { paddingValues ->
        LazyColumn(
            contentPadding = paddingValues,
            modifier = Modifier.fillMaxSize()
        ) {
            items(notifications) { item ->
                NotificationRow(item = item, onClick = { onNavigateToDetail(item.id) })
                HorizontalDivider()
            }
        }
    }
}

@Composable
fun NotificationRow(
    item: NotificationItem,
    onClick: () -> Unit
) {
    val indicatorColor = when(item.type) {
        "update" -> MaterialTheme.colorScheme.primary
        "promo" -> MaterialTheme.colorScheme.tertiary
        "system" -> MaterialTheme.colorScheme.error
        else -> MaterialTheme.colorScheme.secondary
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .background(if (item.isRead) Color.Transparent else MaterialTheme.colorScheme.primary.copy(alpha = 0.05f))
            .padding(16.dp),
        verticalAlignment = Alignment.Top
    ) {
        Box(
            modifier = Modifier
                .padding(top = 6.dp)
                .size(10.dp)
                .clip(CircleShape)
                .background(if (item.isRead) Color.Transparent else indicatorColor)
        )
        
        Spacer(modifier = Modifier.width(12.dp))
        
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = item.title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = if (item.isRead) FontWeight.Normal else FontWeight.Bold
            )
            
            Spacer(modifier = Modifier.height(4.dp))
            
            Text(
                text = item.message,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
            
            Spacer(modifier = Modifier.height(4.dp))
            
            Text(
                text = item.time,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.outline
            )
        }
    }
}

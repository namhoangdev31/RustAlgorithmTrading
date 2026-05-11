package com.lepos.lepos.ui.profile.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material.icons.filled.Help
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@Composable
fun SettingsGrid(
    onMyReviewsClick: () -> Unit,
    onNotificationsClick: () -> Unit,
    onSupportClick: () -> Unit,
    onActivityClick: () -> Unit,
    onAboutClick: () -> Unit,
    onLogoutClick: () -> Unit
) {
    Column(
        modifier = Modifier.padding(horizontal = 16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            SettingsCard(
                title = "My Reviews",
                subtitle = "Rate & Review",
                icon = Icons.Default.Star,
                iconColor = MaterialTheme.colorScheme.tertiary,
                modifier = Modifier
                    .weight(1f)
                    .clickable(onClick = onMyReviewsClick)
            )

            SettingsCard(
                title = "Notifications",
                subtitle = "Alerts & Push",
                icon = Icons.Default.Notifications,
                iconColor = MaterialTheme.colorScheme.primary,
                modifier = Modifier
                    .weight(1f)
                    .clickable(onClick = onNotificationsClick)
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            SettingsCard(
                title = "Activity",
                subtitle = "Logs & History",
                icon = Icons.Default.History,
                iconColor = Color(0xFFFF9500), // Orange
                modifier = Modifier
                    .weight(1f)
                    .clickable(onClick = onActivityClick)
            )

            SettingsCard(
                title = "Security",
                subtitle = "2FA & Privacy",
                icon = Icons.Default.Security,
                iconColor = MaterialTheme.colorScheme.primary,
                modifier = Modifier.weight(1f)
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            SettingsCard(
                title = "About",
                subtitle = "App Info",
                icon = Icons.Default.Info,
                iconColor = Color(0xFF8E8E93), // Gray
                modifier = Modifier
                    .weight(1f)
                    .clickable(onClick = onAboutClick)
            )

            SettingsCard(
                title = "Support",
                subtitle = "24/7 Concierge",
                icon = Icons.Default.Help,
                iconColor = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier
                    .weight(1f)
                    .clickable(onClick = onSupportClick)
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        SettingsCard(
            title = "Log out",
            subtitle = "Switch account",
            icon = Icons.Default.ExitToApp,
            iconColor = MaterialTheme.colorScheme.error,
            isDestructive = true,
            modifier = Modifier
                .fillMaxWidth()
                .clickable(onClick = onLogoutClick)
        )
    }
}

@Composable
fun SettingsCard(
    title: String,
    subtitle: String,
    icon: ImageVector,
    iconColor: Color,
    isDestructive: Boolean = false,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier.height(120.dp),
        shape = RoundedCornerShape(20.dp),
        color = MaterialTheme.colorScheme.surface,
        shadowElevation = 4.dp, // Increased shadow to match iOS
        tonalElevation = 4.dp
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.SpaceBetween,
            horizontalAlignment = Alignment.Start
        ) {
            Surface(
                shape = CircleShape,
                color = iconColor.copy(alpha = 0.1f),
                modifier = Modifier.size(40.dp)
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = iconColor,
                    modifier = Modifier.padding(8.dp)
                )
            }

            Column {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold,
                    color = if (isDestructive) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = if (isDestructive) MaterialTheme.colorScheme.error.copy(alpha = 0.6f) else MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

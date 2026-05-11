package com.lepos.lepos.ui.miniappdetails.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.CloudDownload
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.MoreHoriz
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun MiniAppHeader(
    // UI-only: No data model dependency
    isDownloaded: Boolean,
    isLoading: Boolean,
    onOpen: () -> Unit,
    onUninstall: () -> Unit,
    onDownload: () -> Unit,
    onDeveloperClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        horizontalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // App Icon with Shadow
        Box(
            modifier = Modifier
                .size(118.dp)
                .shadow(10.dp, RoundedCornerShape(22.dp), clip = false)
        ) {
            // Mock Icon
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .clip(RoundedCornerShape(22.dp))
                    .background(Color.Blue.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Inventory2, // Fallback icon
                    contentDescription = null,
                    tint = Color.Blue,
                    modifier = Modifier.size(50.dp)
                )
            }
        }

        Column(modifier = Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = "EcoTrack Pro", // Mock Name
                    style = MaterialTheme.typography.titleLarge.copy(
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold
                    ),
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f, fill = false)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Icon(
                    imageVector = Icons.Default.CheckCircle, // Verified badge
                    contentDescription = "Verified",
                    tint = Color.Green,
                    modifier = Modifier.size(20.dp)
                )
            }

            TextButton(
                onClick = onDeveloperClick,
                contentPadding = PaddingValues(0.dp),
                modifier = Modifier.height(24.dp)
            ) {
                Text(
                    text = "EcoSolutions Inc.",
                    style = MaterialTheme.typography.bodyMedium.copy(
                        color = Color.Blue,
                        fontWeight = FontWeight.Medium
                    )
                )
            }

            Text(
                text = "Carbon Footprint Tracker", // Mock Subtitle
                style = MaterialTheme.typography.bodyMedium.copy(color = Color.Gray),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )


            Spacer(modifier = Modifier.weight(1f))

            Row(verticalAlignment = Alignment.CenterVertically) {
                if (isDownloaded) {
                    Button(
                        onClick = onOpen,
                        shape = RoundedCornerShape(50), // Pill shape
                        colors = ButtonDefaults.buttonColors(containerColor = Color.Blue),
                        contentPadding = PaddingValues(horizontal = 20.dp, vertical = 0.dp),
                        modifier = Modifier.height(30.dp)
                    ) {
                        Text("OPEN", fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    // More/Uninstall Menu Button
                    IconButton(
                        onClick = onUninstall, // Simplified for demo, usually opens dropdown
                        modifier = Modifier.size(30.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.MoreHoriz,
                            contentDescription = "Options",
                            tint = Color.Blue,
                            modifier = Modifier.size(24.dp)
                        )
                    }
                } else {
                    Button(
                        onClick = onDownload,
                        shape = RoundedCornerShape(50),
                        colors = ButtonDefaults.buttonColors(containerColor = Color.Blue),
                        contentPadding = PaddingValues(horizontal = 20.dp, vertical = 0.dp),
                        modifier = Modifier.height(30.dp),
                        enabled = !isLoading
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(
                                color = Color.White,
                                modifier = Modifier.size(16.dp),
                                strokeWidth = 2.dp
                            )
                        } else {
                            Icon(
                                imageVector = Icons.Default.CloudDownload,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("GET", fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                Spacer(modifier = Modifier.weight(1f))

                IconButton(onClick = {}) {
                    Icon(
                        Icons.Default.Share,
                        contentDescription = "Share",
                        tint = Color.Blue,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }

            Text(
                text = "IN-APP PURCHASES",
                style = MaterialTheme.typography.labelSmall,
                color = Color.Gray,
                fontSize = 10.sp,
                fontWeight = FontWeight.Medium,
                modifier = Modifier.padding(top = 8.dp)
            )
        }
    }
}

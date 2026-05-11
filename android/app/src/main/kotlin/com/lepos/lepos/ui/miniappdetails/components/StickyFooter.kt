package com.lepos.lepos.ui.miniappdetails.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Divider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.lepos.lepos.domain.model.bundle.Bundle

@Composable
fun StickyFooter(
    // UI-only
    isDownloaded: Boolean,
    onOpen: () -> Unit,
    onDownload: () -> Unit
) {
    Column {
        Divider(color = Color.LightGray.copy(alpha = 0.5f))
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(MaterialTheme.colorScheme.surface.copy(alpha = 0.95f)) // Translucent background
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Mock Icon
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(Color.Blue.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                 Icon(
                     imageVector = androidx.compose.material.icons.Icons.Default.Inventory2,
                     contentDescription = null,
                     tint = Color.Blue,
                     modifier = Modifier.size(24.dp)
                 )
            }

            Column(
                modifier = Modifier
                    .padding(start = 12.dp)
                    .weight(1f)
            ) {
                Text("EcoTrack Pro", fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                Text("Productivity", fontSize = 12.sp, color = Color.Gray)
            }
            
            if (isDownloaded) {
                Button(
                    onClick = onOpen,
                    shape = RoundedCornerShape(50),
                    colors = ButtonDefaults.buttonColors(containerColor = Color.Blue),
                    contentPadding = PaddingValues(horizontal = 20.dp, vertical = 0.dp),
                    modifier = Modifier.height(30.dp)
                ) {
                    Text("OPEN", fontSize = 14.sp, fontWeight = FontWeight.Bold)
                }
            } else {
                Button(
                    onClick = onDownload,
                    shape = RoundedCornerShape(50),
                    colors = ButtonDefaults.buttonColors(containerColor = Color.Blue),
                    contentPadding = PaddingValues(horizontal = 20.dp, vertical = 0.dp),
                    modifier = Modifier.height(30.dp)
                ) {
                    Text("GET", fontSize = 14.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

package com.lepos.lepos.ui.miniappdetails.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun PreviewSection() {
    Column(modifier = Modifier.padding(vertical = 16.dp)) {
        Text(
            "Preview",
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 16.dp)
        )
        
        Row(
            modifier = Modifier
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 20.dp), // Vertical padding for shadow
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            repeat(3) { i ->
                // Phone Frame Mockup
                Box(
                    modifier = Modifier
                        .width(250.dp)
                        .height(500.dp)
                        .shadow(10.dp, RoundedCornerShape(38.dp), clip = false)
                        .clip(RoundedCornerShape(38.dp))
                        .background(MaterialTheme.colorScheme.surface)
                        .border(4.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f), RoundedCornerShape(38.dp))
                ) {
                    // Screen Content
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(12.dp) // Bezel
                            .clip(RoundedCornerShape(26.dp))
                            .background(MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.1f)),
                        contentAlignment = Alignment.Center
                    ) {
                         Text("Screen ${i + 1}", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    
                    // Notch
                    Box(
                        modifier = Modifier
                            .align(Alignment.TopCenter)
                            .padding(top = 18.dp)
                            .width(80.dp)
                            .height(24.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(MaterialTheme.colorScheme.onSurface)
                    )
                    
                    // Home Indicator
                    Box(
                         modifier = Modifier
                            .align(Alignment.BottomCenter)
                            .padding(bottom = 20.dp)
                            .width(100.dp)
                            .height(4.dp)
                            .clip(RoundedCornerShape(2.dp))
                            .background(MaterialTheme.colorScheme.outline.copy(alpha = 0.5f))
                    )
                }
            }
        }
    }
}

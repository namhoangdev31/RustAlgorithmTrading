package com.lepos.lepos.ui.editor_choice.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun EditorChoiceHeader() {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(500.dp)
            .background(MaterialTheme.colorScheme.surfaceVariant) // Dark Fallback
    ) {
        // Gradient Overlays
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    brush = Brush.verticalGradient(
                        colors = listOf(MaterialTheme.colorScheme.scrim.copy(alpha = 0.6f), Color.Transparent, MaterialTheme.colorScheme.scrim.copy(alpha = 0.8f))
                    )
                )
        )
        
        Column(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .padding(24.dp)
                .padding(bottom = 20.dp)
        ) {
            Text(
                text = "ĐƯỢC YÊU THÍCH",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.8f),
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Step Into the\nArena:\nCrossfire\nLegends",
                style = MaterialTheme.typography.displayMedium,
                color = MaterialTheme.colorScheme.onSurface,
                fontWeight = FontWeight.Black,
                lineHeight = 44.sp
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "Crossfire Legends",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                fontWeight = FontWeight.SemiBold
            )
        }
    }
}

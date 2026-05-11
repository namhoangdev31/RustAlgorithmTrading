package com.lepos.lepos.ui.miniappdetails.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lepos.lepos.domain.model.bundle.Bundle

@Composable
fun WhatsNewSection() {
    Column(
        modifier = Modifier
            .padding(16.dp)
            .background(Color.LightGray.copy(alpha = 0.1f), shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp))
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("What's New", fontSize = 18.sp, fontWeight = FontWeight.Bold)
            Text("Version History", color = Color.Blue, fontSize = 16.sp, modifier = Modifier.clickable { })
        }
        
        Spacer(modifier = Modifier.height(12.dp))
        
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text("Version 2.0.0", fontSize = 14.sp, color = Color.Gray)
            Text("2d ago", fontSize = 14.sp, color = Color.Gray)
        }
        
        Spacer(modifier = Modifier.height(8.dp))
        
        Text(
            "We've redesigned the dashboard to be even more intuitive. Now featuring local smart meter integration and improved AI classification for eco-purchases.",
            fontSize = 14.sp,
            lineHeight = 20.sp,
            maxLines = 4,
            overflow = TextOverflow.Ellipsis
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        Text("more", color = Color.Blue, fontSize = 14.sp, modifier = Modifier.clickable { })
    }
}

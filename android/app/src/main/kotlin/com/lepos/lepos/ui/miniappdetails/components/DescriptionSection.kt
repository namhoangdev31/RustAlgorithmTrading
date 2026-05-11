package com.lepos.lepos.ui.miniappdetails.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun DescriptionSection() {
    Column(modifier = Modifier.padding(16.dp)) {
        Text(
            "EcoTrack Pro is your all-in-one companion for a greener lifestyle. Automatically track your carbon footprint from daily purchases.",
            fontSize = 14.sp,
            fontWeight = FontWeight.SemiBold,
            lineHeight = 20.sp
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            "Join over 500,000 eco-warriors and start making a real difference today. Our advanced AI-driven categorization seamlessly integrates with your digital receipts and smart home devices to give you a real-time view of your environmental impact.",
            fontSize = 14.sp,
            color = Color.Gray,
            lineHeight = 20.sp
        )

        Spacer(modifier = Modifier.height(16.dp))

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clickable { },
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text("GreenLogic Labs", color = Color.Blue, fontSize = 14.sp)
            Icon(Icons.Default.ChevronRight, contentDescription = null, tint = Color.Gray)
        }
    }
}

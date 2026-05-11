package com.lepos.lepos.ui.checkout.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.RadioButtonChecked
import androidx.compose.material.icons.outlined.CreditCard
import androidx.compose.material.icons.outlined.Money
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@Composable
fun CheckoutPaymentMethodView(
    onManageClick: () -> Unit
) {
    var selectedMethod by remember { mutableStateOf("iOS") }

    Column(
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                "PAYMENT METHOD",
                style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            TextButton(onClick = onManageClick) {
                Text(
                    "Manage",
                    style = MaterialTheme.typography.labelSmall.copy(color = Color(0xFF00ADB5))
                )
            }
        }

        Row(
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 16.dp)
        ) {
            PaymentCard(
                selected = selectedMethod == "iOS",
                onClick = { selectedMethod = "iOS" },
                title = "Apple Pay", // Or Google Pay for Android context
                subtitle = "Android Pay"
            ) {
                Text(
                    "Android",
                    color = Color(0xFF00ADB5),
                    fontWeight = FontWeight.Bold,
                    style = MaterialTheme.typography.labelSmall
                )
            }

            PaymentCard(
                selected = selectedMethod == "Visa",
                onClick = { selectedMethod = "Visa" },
                title = "•••• 4242",
                subtitle = "VISA"
            ) {
                Icon(Icons.Outlined.CreditCard, null, tint = Color.Gray)
            }
            PaymentCard(
                selected = selectedMethod == "Bank",
                onClick = { selectedMethod = "Bank" },
                title = "$142.00",
                subtitle = "BANK"
            ) {
                Icon(Icons.Outlined.Money, null, tint = Color.Gray)
            }
        }
    }
}

@Composable
fun PaymentCard(
    selected: Boolean,
    onClick: () -> Unit,
    title: String,
    subtitle: String,
    iconContent: @Composable () -> Unit
) {
    Box(
        modifier = Modifier
            .width(120.dp)
            .height(90.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(if (selected) Color(0xFF00ADB5).copy(alpha = 0.1f) else MaterialTheme.colorScheme.background)
            .border(
                width = 2.dp,
                color = if (selected) Color(0xFF00ADB5) else Color.Transparent,
                shape = RoundedCornerShape(16.dp)
            )
            .clickable { onClick() }
            .padding(12.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            iconContent()
            Column {
                Text(
                    subtitle,
                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                    color = if (selected) Color(0xFF00ADB5) else Color.Gray
                )
                Text(
                    title,
                    style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold)
                )
            }
        }

        if (selected) {
            Icon(
                Icons.Default.RadioButtonChecked,
                contentDescription = null,
                tint = Color(0xFF00ADB5),
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .size(16.dp)
            )
        }
    }
}

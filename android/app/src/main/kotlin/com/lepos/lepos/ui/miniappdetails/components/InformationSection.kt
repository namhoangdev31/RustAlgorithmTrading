package com.lepos.lepos.ui.miniappdetails.components

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material3.Divider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lepos.lepos.domain.model.bundle.*

@Composable
fun InformationSection(bundle: Bundle?, promotions: List<BundlePromotion> = emptyList()) {
    Column(modifier = Modifier.padding(16.dp)) {
        Text("Information", fontSize = 20.sp, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(16.dp))
        
        InfoRow(label = "Developer", value = "GreenLogic Labs LLC")
        CustomDivider()
        InfoRow(label = "Size", value = "42.8 MB")
        CustomDivider()
        InfoRow(label = "Category", value = "Productivity")
        CustomDivider()
        InfoRow(label = "Compatibility", value = "Works on this Device", isLink = true)
        CustomDivider()
        InfoRow(label = "Languages", value = "English and 12 more")
        CustomDivider()
        InfoRow(label = "Age Rating", value = "4+")
        
        if (promotions.isNotEmpty()) {
            CustomDivider()
            Spacer(modifier = Modifier.height(16.dp))
            Text("Active Promotions", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
            promotions.forEach { promo ->
                InfoRow(label = promo.promoCode ?: "Discount", value = "${promo.promoType}: ${promo.discountValue}")
            }
        }
    }
}

@Composable
fun InfoRow(label: String, value: String, isLink: Boolean = false) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(label, color = Color.Gray, fontSize = 14.sp)
        
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                value, 
                color = if (isLink) Color.Blue else Color.Black,
                fontSize = 14.sp
            )
            if (isLink) {
                Icon(Icons.Default.KeyboardArrowDown, contentDescription = null, tint = Color.Blue, modifier = Modifier.size(16.dp))
            }
        }
    }
}

@Composable
fun CustomDivider() {
    Divider(color = Color.LightGray.copy(alpha = 0.3f), modifier = Modifier.padding(start = 0.dp))
}

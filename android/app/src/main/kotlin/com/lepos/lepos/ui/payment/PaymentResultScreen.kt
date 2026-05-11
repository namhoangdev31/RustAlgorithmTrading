package com.lepos.lepos.ui.payment

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.outlined.ContentCopy
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Divider
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

enum class PaymentResultType {
    SUCCESS, FAILURE
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PaymentResultScreen(
    type: PaymentResultType,
    onNavigateBack: () -> Unit,
    onNavigateHome: () -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { },
                actions = {
                    IconButton(onClick = if (type == PaymentResultType.SUCCESS) onNavigateHome else onNavigateBack) {
                        Box(
                            modifier = Modifier
                                .size(32.dp)
                                .clip(CircleShape)
                                .background(Color.White),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.Black, modifier = Modifier.size(16.dp))
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f))
            )
        },
        containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(40.dp))
            
            // Status Icon
            Box(contentAlignment = Alignment.Center) {
                Box(
                    modifier = Modifier
                        .size(120.dp)
                        .shadow(
                            elevation = 20.dp,
                            shape = CircleShape,
                            spotColor = if (type == PaymentResultType.SUCCESS) Color.Green.copy(alpha = 0.3f) else Color.Red.copy(alpha = 0.3f)
                        )
                        .background(Color.White, CircleShape)
                )
                
                Box(
                    modifier = Modifier
                        .size(80.dp)
                        .clip(CircleShape)
                        .background(if (type == PaymentResultType.SUCCESS) Color(0xFF00E676) else Color(0xFFEF5350)), // Green or Red
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        if (type == PaymentResultType.SUCCESS) Icons.Default.Check else Icons.Default.Close,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(40.dp)
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(40.dp))
            
            // Title & Message
            Text(
                if (type == PaymentResultType.SUCCESS) "Payment Successful" else "Payment Failed",
                style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold),
                textAlign = TextAlign.Center
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Text(
                if (type == PaymentResultType.SUCCESS)
                    "Your transaction has been processed\nand your mini-app is ready to use."
                else
                    "Something went wrong. Please check\nyour payment method and try again.",
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
                lineHeight = 24.sp
            )
            
            Spacer(modifier = Modifier.height(40.dp))
            
            // Details Card
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(32.dp))
                    .background(Color.White)
                    .padding(32.dp),
                verticalArrangement = Arrangement.spacedBy(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                if (type == PaymentResultType.SUCCESS) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("TOTAL AMOUNT", style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold), color = Color.Gray)
                        Text("$45.00", style = MaterialTheme.typography.displayMedium.copy(fontWeight = FontWeight.Bold, fontSize = 40.sp))
                    }
                    
                    Divider(color = Color.LightGray.copy(alpha = 0.2f))
                    
                    DetailRow(label = "TRANSACTION ID", value = "#TRX-992031", showCopy = true)
                    DetailRow(label = "DATE", value = "Oct 24, 2023")
                    DetailRow(label = "TIME", value = "10:30 AM") // Simplified layout
                    
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color(0xFF00E676).copy(alpha = 0.1f))
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("READY FOR LAUNCH", style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold), color = Color(0xFF00E676))
                    }
                } else {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("ATTEMPTED AMOUNT", style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold), color = Color.Gray)
                        Text("$45.00", style = MaterialTheme.typography.displayMedium.copy(fontWeight = FontWeight.Bold, fontSize = 40.sp))
                    }
                    
                    Divider(color = Color.LightGray.copy(alpha = 0.2f))
                    
                    DetailRow(label = "TRANSACTION ID", value = "#TRX-992031", showCopy = true)
                    
                    Row(modifier = Modifier.fillMaxWidth()) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("ERROR CODE", style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold), color = Color.Gray)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("DEC-042", style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Medium), color = Color(0xFFEF5350))
                        }
                        
                         Column(horizontalAlignment = Alignment.End) {
                            Text("REASON", style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold), color = Color.Gray)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("Insuff. Funds", style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Medium))
                        }
                    }
                    
                     Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color(0xFFEF5350).copy(alpha = 0.05f))
                            .border(1.dp, Color(0xFFEF5350).copy(alpha = 0.1f), RoundedCornerShape(12.dp))
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Box(modifier = Modifier.size(6.dp).background(Color(0xFFEF5350), CircleShape))
                            Text("ACTION REQUIRED", style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold), color = Color(0xFFEF5350))
                        }
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(40.dp))
            
            // Buttons
             Button(
                onClick = {
                    if (type == PaymentResultType.SUCCESS) {
                        // Launch Mini App
                    } else {
                        onNavigateBack() // Retry
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                colors = ButtonDefaults.buttonColors(containerColor = if (type == PaymentResultType.SUCCESS) Color(0xFF00E676) else Color.Black),
                shape = RoundedCornerShape(28.dp)
            ) {
                Text(if (type == PaymentResultType.SUCCESS) "Launch Mini App" else "Retry Payment", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
             Button(
                onClick = onNavigateHome,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp)
                    .border(1.dp, Color.Gray.copy(alpha=0.2f), RoundedCornerShape(28.dp)),
                colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                shape = RoundedCornerShape(28.dp)
            ) {
                Text(if (type == PaymentResultType.SUCCESS) "Back to Home" else "Contact Support", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold), color = Color.Black)
            }
            
             if (type == PaymentResultType.FAILURE) {
                 Spacer(modifier = Modifier.height(24.dp))
                 Text(
                     "Back to Home", 
                     style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold), 
                     color = Color.Gray,
                     modifier = Modifier.clickable(onClick = onNavigateHome)
                 )
             }
             
             Spacer(modifier = Modifier.height(40.dp))
        }
    }
}

@Composable
fun DetailRow(label: String, value: String, showCopy: Boolean = false) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(label, style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold), color = Color.Gray)
            Text(value, style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Medium))
        }
        
        if (showCopy) {
            Icon(Icons.Outlined.ContentCopy, contentDescription = "Copy", tint = Color.Gray, modifier = Modifier.size(16.dp))
        }
    }
}

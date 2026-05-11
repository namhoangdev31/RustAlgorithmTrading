package com.lepos.lepos.ui.payment

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Wallet
import androidx.compose.material.icons.outlined.CreditCard
import androidx.compose.material.icons.outlined.AccountBalance
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PaymentMethodsScreen(
    onNavigateBack: () -> Unit,
    onNavigateToAddCard: () -> Unit,
    onNavigateToConnectWallet: () -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Text(
                        "Payment Methods", 
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                         modifier = Modifier.fillMaxWidth(),
                        textAlign = TextAlign.Center
                    ) 
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = onNavigateToAddCard) {
                        Box(
                            modifier = Modifier
                                .size(32.dp)
                                .clip(CircleShape)
                                .background(Color(0xFF00ADB5)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.Add, contentDescription = "Add", tint = Color.White)
                        }
                    }
                },
                 colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background)
            )
        },
        containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            // Wallet Card
            WalletBalanceCard(
                balance = 1248.50,
                onNavigateToConnectWallet = onNavigateToConnectWallet
            )
            
            // Primary Method
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(
                    "PRIMARY METHOD",
                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                
                PrimaryMethodCard()
            }
            
            // Saved Cards
             Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(
                    "SAVED CARDS & ACCOUNTS",
                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                
                SavedMethodCard(title = "Visa Platinum", subtitle = "•••• 4242", type = MethodType.VISA)
                SavedMethodCard(title = "Mastercard World", subtitle = "•••• 8812", type = MethodType.MASTERCARD)
                SavedMethodCard(title = "Global Savings", subtitle = "CHASE •••• 9012", type = MethodType.BANK)
            }
             
             // Footer
             Column(
                 modifier = Modifier.fillMaxWidth().padding(top = 16.dp),
                 horizontalAlignment = Alignment.CenterHorizontally,
                 verticalArrangement = Arrangement.spacedBy(8.dp)
             ) {
                 Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                     Icon(Icons.Default.Security, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(16.dp))
                     Text("PCI-DSS COMPLIANT", style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold), color = MaterialTheme.colorScheme.onSurfaceVariant)
                 }
                 
                 Text(
                     "Your payment information is encrypted and never stored on our servers.",
                     style = MaterialTheme.typography.bodySmall,
                     color = MaterialTheme.colorScheme.onSurfaceVariant,
                     textAlign = TextAlign.Center,
                     modifier = Modifier.padding(horizontal = 32.dp)
                 )
             }
             
             Spacer(modifier = Modifier.height(32.dp))
        }
    }
}

@Composable
fun WalletBalanceCard(
    balance: Double,
    onNavigateToConnectWallet: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1A262F)), // Dark Teal/Black
        elevation = CardDefaults.cardElevation(8.dp),
        modifier = Modifier.fillMaxWidth().height(180.dp)
    ) {
        Box(modifier = Modifier.fillMaxSize().padding(24.dp)) {
            // Content
            Column(modifier = Modifier.align(Alignment.TopStart)) {
                Text(
                    "WALLET BALANCE",
                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                    color = Color(0xFF00ADB5)
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    "$${String.format("%,.2f", balance)}",
                    style = MaterialTheme.typography.displayMedium.copy(fontWeight = FontWeight.Light),
                    color = Color.White
                )
            }
            
            // Icon
            Icon(
                Icons.Default.Wallet,
                contentDescription = null,
                tint = Color(0xFF00ADB5),
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .size(40.dp)
                    .background(Color(0xFF00ADB5).copy(alpha = 0.2f), RoundedCornerShape(12.dp))
                    .padding(8.dp)
            )
            
            // Buttons
            Row(
                modifier = Modifier.align(Alignment.BottomStart),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                WalletButton(text = "Top Up", onClick = onNavigateToConnectWallet)
                WalletButton(text = "History")
            }
        }
    }
}

@Composable
fun WalletButton(
    text: String,
    onClick: () -> Unit = {}
) {
    Box(
        modifier = Modifier
            .background(Color.White.copy(alpha = 0.15f), RoundedCornerShape(20.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 20.dp, vertical = 10.dp)
    ) {
        Text(
            text,
            style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.SemiBold),
            color = Color.White
        )
    }
}

@Composable
fun PrimaryMethodCard() {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(24.dp),
        elevation = CardDefaults.cardElevation(2.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Box(modifier = Modifier.padding(16.dp).fillMaxWidth()) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Icon
                Box(
                    modifier = Modifier
                        .size(56.dp)
                        .background(Color.Black, RoundedCornerShape(16.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Text("Pay", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                }
                
                Column {
                    Text("Google Pay", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                    Text("Pixel 8 Pro", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            
            // Default Badge
            Box(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .background(Color(0xFF00ADB5).copy(alpha = 0.1f), RoundedCornerShape(8.dp))
                    .padding(horizontal = 8.dp, vertical = 4.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    Icon(Icons.Default.CheckCircle, null, tint = Color(0xFF00ADB5), modifier = Modifier.size(12.dp))
                    Text("DEFAULT", style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold), color = Color(0xFF00ADB5))
                }
            }
            
            // Edit Button
            TextButton(
                onClick = {},
                modifier = Modifier.align(Alignment.BottomEnd)
            ) {
                Text("Edit", color = Color(0xFF00ADB5), fontWeight = FontWeight.Bold)
            }
        }
    }
}

enum class MethodType { VISA, MASTERCARD, BANK }

@Composable
fun SavedMethodCard(title: String, subtitle: String, type: MethodType) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(24.dp),
        elevation = CardDefaults.cardElevation(2.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(16.dp).fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Icon
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .background(
                        color = when(type) {
                            MethodType.VISA -> Color(0xFFEEF2FF)
                            MethodType.MASTERCARD -> Color(0xFFFFF0F0)
                            MethodType.BANK -> Color(0xFFECFDF5)
                        },
                        shape = RoundedCornerShape(12.dp)
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = when(type) {
                        MethodType.VISA, MethodType.MASTERCARD -> Icons.Outlined.CreditCard
                        MethodType.BANK -> Icons.Outlined.AccountBalance
                    },
                    contentDescription = null,
                    tint = when(type) {
                        MethodType.VISA -> Color.Blue
                        MethodType.MASTERCARD -> Color.Red
                        MethodType.BANK -> Color(0xFF00ADB5)
                    }
                )
            }
            
            Column(modifier = Modifier.weight(1f)) {
                Text(title, style = MaterialTheme.typography.bodyLarge.copy(fontWeight = FontWeight.Bold))
                Text(subtitle, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            
            IconButton(onClick = {}) {
                Icon(Icons.Default.MoreVert, contentDescription = "More", tint = Color.Gray)
            }
        }
    }
}

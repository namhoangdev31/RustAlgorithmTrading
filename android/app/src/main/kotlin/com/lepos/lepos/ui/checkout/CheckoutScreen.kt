package com.lepos.lepos.ui.checkout

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.lepos.lepos.ui.checkout.components.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CheckoutScreen(
    appId: String,
    price: Double,
    onNavigateBack: () -> Unit,
    onNavigateToPaymentMethods: () -> Unit
) {
    val tax = price * 0.1 // Estimated tax
    val total = price + tax
    
    // Mock Data
    val appName = "CloudStudio Pro"
    val appDeveloper = "Professional Creative Suite • Monthly"

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
             // Optional: Add TopAppBar if needed for back navigation consistency, 
             // but design might imply a modal sheet look.
        }
    ) { paddingValues ->
        Box(modifier = Modifier.fillMaxSize().padding(paddingValues)) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 16.dp)
                    .padding(bottom = 100.dp) // Space for fixed button
            ) {
                // Product Card
                CheckoutProductCard(
                    appName = appName,
                    appDeveloper = appDeveloper,
                    price = price
                )

                // Payment Method
                CheckoutPaymentMethodView(
                    onManageClick = onNavigateToPaymentMethods
                )
                
                Spacer(modifier = Modifier.height(24.dp))

                // Transaction Details
                CheckoutTransactionDetails(
                    price = price,
                    tax = tax
                )
                
                Spacer(modifier = Modifier.height(24.dp))

                // Footer Text
                Text(
                    "By clicking \"Pay Now\" you agree to our Terms of Service and Privacy Policy. Subscription auto-renews monthly.",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                    modifier = Modifier
                        .padding(horizontal = 24.dp)
                        .fillMaxWidth()
                )
            }

            // Bottom Section (Pay Button)
            Box(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .background(
                        Brush.verticalGradient(
                            listOf(Color.Transparent, MaterialTheme.colorScheme.background)
                        )
                    )
                    .padding(16.dp)
            ) {
                CheckoutPayButton(
                    total = total,
                    onClick = {
                        // Simulate payment logic
                        onNavigateBack() 
                    }
                )
            }
        }
    }
}

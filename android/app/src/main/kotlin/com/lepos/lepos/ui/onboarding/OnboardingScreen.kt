package com.lepos.lepos.ui.onboarding

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch

data class OnboardingPage(
    val title: String,
    val description: String,
    val icon: ImageVector? = null // Placeholder for real illustration
)

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun OnboardingScreen(onCompleted: () -> Unit) {
    val pages = listOf(
        OnboardingPage(
            "Welcome to Lepos",
            "Discover a world of mini-apps and seamless experiences right at your fingertips."
        ),
        OnboardingPage(
            "Instant Apps",
            "Use apps instantly without downloading. Fast, secure, and lightweight."
        ),
        OnboardingPage(
            "Safe & Secure",
            "Your privacy is our priority. Enjoy a secure ecosystem with verified apps."
        )
    )
    
    val pagerState = rememberPagerState(pageCount = { pages.size })
    val coroutineScope = rememberCoroutineScope()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Skip Button
        Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.TopEnd) {
            TextButton(onClick = onCompleted) {
                Text("Skip")
            }
        }
        
        Spacer(modifier = Modifier.weight(1f))
        
        // Pager
        HorizontalPager(
            state = pagerState,
            modifier = Modifier.fillMaxWidth()
        ) { page ->
            OnboardingPageContent(pages[page])
        }
        
        Spacer(modifier = Modifier.weight(1f))
        
        // Indicators & Button
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Indicators
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                repeat(pages.size) { iteration ->
                    val color = if (pagerState.currentPage == iteration) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outlineVariant
                    Box(
                        modifier = Modifier
                            .size(10.dp)
                            .clip(CircleShape)
                            .background(color)
                    )
                }
            }
            
            // Next/Done Button
            Button(
                onClick = {
                    if (pagerState.currentPage < pages.size - 1) {
                         coroutineScope.launch {
                             pagerState.animateScrollToPage(pagerState.currentPage + 1)
                         }
                    } else {
                        onCompleted()
                    }
                }
            ) {
                 Text(if (pagerState.currentPage < pages.size - 1) "Next" else "Get Started")
            }
        }
    }
}

@Composable
fun OnboardingPageContent(page: OnboardingPage) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Box(
            modifier = Modifier
                .size(200.dp)
                .background(MaterialTheme.colorScheme.primaryContainer, shape = CircleShape),
            contentAlignment = Alignment.Center
        ) {
             // Placeholder Image
             Icon(
                 imageVector = Icons.Default.Check, // Placeholder
                 contentDescription = null,
                 modifier = Modifier.size(80.dp),
                 tint = MaterialTheme.colorScheme.onPrimaryContainer
             )
        }
        Spacer(modifier = Modifier.height(32.dp))
        Text(
            text = page.title,
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = page.description,
            style = MaterialTheme.typography.bodyLarge,
            textAlign = TextAlign.Center,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

package com.lepos.lepos.ui.main

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Explore
import androidx.compose.material.icons.filled.Layers
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Star
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.lepos.lepos.ui.home.HomeScreen

@Composable
fun MainScreen(
    onNavigateToActivity: () -> Unit,
    onNavigateToCollection: (String, String) -> Unit,
    onNavigateToCategory: (String, String) -> Unit,
    onNavigateToSettings: () -> Unit,
    onNavigateToMyReviews: () -> Unit,
    onNavigateToNotifications: () -> Unit,
    onNavigateToTopCharts: () -> Unit,
    onNavigateToSupport: () -> Unit,
    onLogout: () -> Unit,
    onNavigateToAccountOverview: () -> Unit,
    onNavigateToAbout: () -> Unit,
    onItemClick: (String) -> Unit
) {
    var selectedItem by remember { mutableIntStateOf(0) }
    // iOS: Today, Discovery, Apps, Profile, Search
    val items = listOf("Today", "Discovery", "Apps", "Profile", "Search")

    // Note: Ensure extended icons are available or use defaults
    val selectedIcons = listOf(
        Icons.Default.Star, // Today
        Icons.Default.Explore, // Discovery (was Home/List)
        Icons.Default.Layers, // Apps
        Icons.Default.Person, // Profile
        Icons.Default.Search // Search
    )
    val unselectedIcons = listOf(
        Icons.Outlined.Star,
        Icons.Default.Explore,
        Icons.Default.Layers,
        Icons.Outlined.Person,
        Icons.Default.Search
    )

    Scaffold(
        bottomBar = {
            NavigationBar(
                containerColor = androidx.compose.material3.MaterialTheme.colorScheme.surface
            ) {
                items.forEachIndexed { index, item ->
                    NavigationBarItem(
                        icon = {
                            Icon(
                                if (selectedItem == index) selectedIcons[index] else unselectedIcons[index],
                                contentDescription = item
                            )
                        },
                        label = { Text(item) },
                        selected = selectedItem == index,
                        onClick = { selectedItem = index }
                    )
                }
            }
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier.padding(
                bottom = 0.dp, top = 0.dp, start = paddingValues.calculateLeftPadding(
                    LayoutDirection.Ltr
                ), end = paddingValues.calculateRightPadding(LayoutDirection.Ltr)
            )
        ) {
            when (selectedItem) {
                0 -> HomeScreen( // Today
                    onItemClick = onItemClick,
                    onNotificationClick = onNavigateToActivity,
                    onCollectionClick = onNavigateToCollection
                )

                1 -> com.lepos.lepos.ui.discovery.DiscoveryScreen( // Discovery
                    onTopChartsClick = onNavigateToTopCharts,
                    onCategoryClick = onNavigateToCategory,
                    onItemClick = onItemClick
                )

                2 -> com.lepos.lepos.ui.library.LibraryScreen(onItemClick = onItemClick) // Apps

                3 -> com.lepos.lepos.ui.profile.ProfileScreen( // Profile
                    onNavigateToSettings = onNavigateToSettings,
                    onNavigateToMyReviews = onNavigateToMyReviews,
                    onNavigateToNotifications = onNavigateToNotifications,
                    onNavigateToSupport = onNavigateToSupport,
                    onNavigateToAccountOverview = onNavigateToAccountOverview,
                    onNavigateToAbout = onNavigateToAbout,
                    onNavigateToActivity = onNavigateToActivity,
                    onLogout = onLogout
                )

                4 -> com.lepos.lepos.ui.search.SearchScreen(onItemClick = onItemClick) // Search

                else -> PlaceholderScreen(items[selectedItem])
            }
        }
    }
}

@Composable
fun PlaceholderScreen(name: String) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text("$name Screen")
    }
}

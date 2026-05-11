package com.lepos.lepos.ui.search

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.lepos.lepos.ui.search.components.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SearchScreen(onItemClick: (String) -> Unit) {
    var searchQuery by remember { mutableStateOf("") }
    var isSearching by remember { mutableStateOf(false) }
    var showFilters by remember { mutableStateOf(false) }
    val sheetState = rememberModalBottomSheetState()
    
    if (showFilters) {
        ModalBottomSheet(
            onDismissRequest = { showFilters = false },
            sheetState = sheetState
        ) {
            SearchFilterSheet(
                onApply = { showFilters = false },
                onReset = { /* Reset logic */ }
            )
        }
    }

    Scaffold { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Search TextField
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { 
                    searchQuery = it 
                    if (it.isEmpty()) isSearching = false
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                placeholder = { Text("Search mini-apps, services...") },
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Filled.Search,
                        contentDescription = null
                    )
                },
                trailingIcon = {
                    IconButton(onClick = { showFilters = true }) {
                        Icon(
                            imageVector = Icons.Filled.Tune, // Uses Tune or FilterList
                            contentDescription = "Filters"
                        )
                    }
                },
                keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(
                    imeAction = androidx.compose.ui.text.input.ImeAction.Search
                ),
                keyboardActions = androidx.compose.foundation.text.KeyboardActions(
                    onSearch = { isSearching = true }
                ),
                singleLine = true,
                shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = MaterialTheme.colorScheme.primary,
                    unfocusedBorderColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f)
                )
            )
            
            if (searchQuery.isEmpty()) {
                // Empty state - show discovery content
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                ) {
                    SearchHeader()
                    SearchQuickCategories()
                    RecommendedForYou(onAppClick = onItemClick)
                    TrendingSearches(onSearchClick = { query -> 
                        searchQuery = query
                        isSearching = true
                    })
                    Box(modifier = Modifier.height(50.dp))
                }
            } else if (isSearching) {
                 SearchResultsScreen(query = searchQuery)
            } else {
                // Active search - show suggestions
                SearchSuggestions(query = searchQuery)
            }
        }
    }
}

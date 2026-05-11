package com.lepos.lepos.ui.search.components

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@Composable
fun SearchFilterSheet(
    onApply: () -> Unit,
    onReset: () -> Unit
) {
    var selectedSort by remember { mutableStateOf("Relevance") }
    var selectedPrice by remember { mutableStateOf("Any Price") }
    
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
            .padding(bottom = 32.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Filters", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
            TextButton(onClick = onReset) {
                Text("Reset", color = MaterialTheme.colorScheme.error)
            }
        }
        
        HorizontalDivider(modifier = Modifier.padding(vertical = 16.dp))
        
        // Sort By
        Text("Sort By", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
        Spacer(modifier = Modifier.height(8.dp))
        SortOptionRow(
            options = listOf("Relevance", "Popularity", "Rating", "Newest"),
            selectedOption = selectedSort,
            onOptionSelected = { selectedSort = it }
        )
        
        Spacer(modifier = Modifier.height(24.dp))
        
        // Price
        Text("Price", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
        Spacer(modifier = Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf("Any Price", "Free", "Paid").forEach { price ->
                FilterChip(
                    selected = selectedPrice == price,
                    onClick = { selectedPrice = price },
                    label = { Text(price) }
                )
            }
        }
        
        Spacer(modifier = Modifier.height(24.dp))

        // Category
        Text("Category", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
        Spacer(modifier = Modifier.height(8.dp))
        // Using a scrollable row for categories or FlowRow if available. iOS uses a Picker.
        // For Android, a scrollable row of chips is a good pattern.
        var selectedCategory by remember { mutableStateOf("All Categories") }
        val categories = listOf("All Categories", "Games", "Apps", "Entertainment", "Education", "Productivity")

        Row(
            modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            categories.forEach { category ->
                FilterChip(
                    selected = selectedCategory == category,
                    onClick = { selectedCategory = category },
                    label = { Text(category) }
                )
            }
        }
        
        Spacer(modifier = Modifier.height(32.dp))
        
        Button(
            onClick = onApply,
            modifier = Modifier.fillMaxWidth(),
            shape = MaterialTheme.shapes.medium
        ) {
            Text("Apply Filters")
        }
    }
}

@Composable
fun SortOptionRow(
    options: List<String>,
    selectedOption: String,
    onOptionSelected: (String) -> Unit
) {
    Column(Modifier.selectableGroup()) {
        options.forEach { text ->
            Row(
                Modifier
                    .fillMaxWidth()
                    .height(48.dp)
                    .selectable(
                        selected = (text == selectedOption),
                        onClick = { onOptionSelected(text) },
                        role = Role.RadioButton
                    )
                    .padding(horizontal = 0.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                RadioButton(
                    selected = (text == selectedOption),
                    onClick = null // null recommended for accessibility with selectable
                )
                Text(
                    text = text,
                    style = MaterialTheme.typography.bodyLarge,
                    modifier = Modifier.padding(start = 16.dp)
                )
            }
        }
    }
}

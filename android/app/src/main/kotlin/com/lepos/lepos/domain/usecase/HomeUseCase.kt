package com.lepos.lepos.domain.usecase

import com.lepos.lepos.domain.model.DomainResult
import com.lepos.lepos.domain.model.HomeItem
import kotlinx.coroutines.delay

class HomeUseCase {
    suspend fun getItems(): DomainResult<List<HomeItem>> {
        // Simulate network delay
        delay(1500)
        
        return DomainResult.Success(
            listOf(
                HomeItem("1", "Dashboard", "View your daily stats"),
                HomeItem("2", "Orders", "Manage pending orders"),
                HomeItem("3", "Products", "Edit catalog"),
                HomeItem("4", "Customers", "View client list"),
                HomeItem("5", "Settings", "App configuration")
            )
        )
    }
}

package com.lepos.lepos.data.repository

import com.lepos.lepos.domain.model.DomainResult
import com.lepos.lepos.domain.model.today.AppCollection
import com.lepos.lepos.domain.model.today.FeaturedApp
import com.lepos.lepos.domain.model.today.MiniApp
import com.lepos.lepos.domain.repository.TodayRepository
import com.lepos.lepos.data.remote.ApiService
import kotlinx.coroutines.delay

class TodayRepositoryImpl(
    private val apiService: ApiService
) : TodayRepository {

    override suspend fun getFeaturedApp(): DomainResult<FeaturedApp> {
        return try {
            val response = apiService.getFeaturedApp()
            if (response.success && response.data != null) {
                val dto = response.data
                DomainResult.Success(
                    FeaturedApp(
                        id = dto.id,
                        processedId = dto.processedId,
                        badge = dto.badge,
                        title = dto.title,
                        subtitle = dto.subtitle,
                        backgroundImageUrl = dto.backgroundImageUrl,
                        app = dto.app?.let { appDto ->
                            MiniApp(
                                id = appDto.id,
                                name = appDto.name,
                                iconUrl = appDto.iconUrl,
                                category = appDto.category,
                                rating = appDto.rating,
                                developer = appDto.developer,
                                price = appDto.price
                            )
                        }
                    )
                )
            } else {
                DomainResult.Error(response.error?.message ?: "Unknown error")
            }
        } catch (e: Exception) {
            DomainResult.Error(e.message ?: "Network error", e)
        }
    }

    override suspend fun getAppsWeLove(): DomainResult<List<MiniApp>> {
        delay(500)
        return DomainResult.Success(
            listOf(
                MiniApp(
                    id = "app_1",
                    name = "QuickTask Pro",
                    iconUrl = "checkmark.circle.fill",
                    category = "Productivity",
                    rating = 4.8,
                    developer = "TaskMaster Inc.",
                    price = "Free"
                ),
                MiniApp(
                    id = "app_2",
                    name = "Wealth Insights",
                    iconUrl = "chart.bar.fill",
                    category = "Finance",
                    rating = 4.7,
                    developer = "Wealth Corp",
                    price = "$4.99"
                ),
                MiniApp(
                    id = "app_3",
                    name = "EcoTrack",
                    iconUrl = "leaf.fill",
                    category = "Lifestyle",
                    rating = 4.9,
                    developer = "Green Earth",
                    price = "Free"
                )
            )
        )
    }

    override suspend fun getTopCollections(): DomainResult<List<AppCollection>> {
        delay(500)
        return DomainResult.Success(
            listOf(
                AppCollection(
                    id = "col_1",
                    name = "Essential FinTech",
                    subtitle = "Manage everything from crypto to classic banking.",
                    coverImageUrl = "https://images.unsplash.com/photo-1565514020176-db7933b4d45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                    apps = listOf()
                ),
                AppCollection(
                    id = "col_2",
                    name = "Weekend Vibes",
                    subtitle = "The best food delivery apps.",
                    coverImageUrl = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                    apps = listOf()
                ),
                AppCollection(
                    id = "col_3",
                    name = "Learn New Skills",
                    subtitle = "Education apps for everyone.",
                    coverImageUrl = "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                    apps = listOf()
                )
            )
        )
    }

    override suspend fun getPersonalizedApps(): DomainResult<List<MiniApp>> {
        delay(500)
        return DomainResult.Success(
            listOf(
                MiniApp(
                    id = "app_p1",
                    name = "Zen Focus",
                    iconUrl = "brain.head.profile",
                    category = "Productivity",
                    rating = 4.8,
                    developer = "Zen Masters",
                    price = "Free"
                ),
                MiniApp(
                    id = "app_p2",
                    name = "Daily Planner",
                    iconUrl = "calendar",
                    category = "Productivity",
                    rating = 4.5,
                    developer = "PlanIt",
                    price = "Free"
                ),
                MiniApp(
                    id = "app_p3",
                    name = "Hydrate",
                    iconUrl = "drop.fill",
                    category = "Health",
                    rating = 4.9,
                    developer = "WaterWorks",
                    price = "$1.99"
                ),
                MiniApp(
                    id = "app_p4",
                    name = "Sleep Well",
                    iconUrl = "moon.stars.fill",
                    category = "Health",
                    rating = 4.6,
                    developer = "SleepyTime",
                    price = "$2.99"
                )
            )
        )
    }
}

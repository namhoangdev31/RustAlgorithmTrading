package com.lepos.lepos.domain.repository

import com.lepos.lepos.domain.model.DomainResult
import com.lepos.lepos.domain.model.today.AppCollection
import com.lepos.lepos.domain.model.today.FeaturedApp
import com.lepos.lepos.domain.model.today.MiniApp

interface TodayRepository {
    suspend fun getFeaturedApp(): DomainResult<FeaturedApp>
    suspend fun getAppsWeLove(): DomainResult<List<MiniApp>>
    suspend fun getTopCollections(): DomainResult<List<AppCollection>>
    suspend fun getPersonalizedApps(): DomainResult<List<MiniApp>>
}

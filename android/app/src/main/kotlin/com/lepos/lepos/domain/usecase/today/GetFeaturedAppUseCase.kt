package com.lepos.lepos.domain.usecase.today

import com.lepos.lepos.domain.model.DomainResult
import com.lepos.lepos.domain.model.today.FeaturedApp
import com.lepos.lepos.domain.repository.TodayRepository

class GetFeaturedAppUseCase(private val repository: TodayRepository) {
    suspend fun invoke(): DomainResult<FeaturedApp> {
        return repository.getFeaturedApp()
    }
}

package com.lepos.lepos.domain.usecase.today

import com.lepos.lepos.domain.model.DomainResult
import com.lepos.lepos.domain.model.today.AppCollection
import com.lepos.lepos.domain.repository.TodayRepository

class GetTopCollectionsUseCase(private val repository: TodayRepository) {
    suspend fun invoke(): DomainResult<List<AppCollection>> {
        return repository.getTopCollections()
    }
}

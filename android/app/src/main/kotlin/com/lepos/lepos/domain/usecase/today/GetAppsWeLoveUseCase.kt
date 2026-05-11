package com.lepos.lepos.domain.usecase.today

import com.lepos.lepos.domain.model.DomainResult
import com.lepos.lepos.domain.model.today.MiniApp
import com.lepos.lepos.domain.repository.TodayRepository

class GetAppsWeLoveUseCase(private val repository: TodayRepository) {
    suspend fun invoke(): DomainResult<List<MiniApp>> {
        return repository.getAppsWeLove()
    }
}

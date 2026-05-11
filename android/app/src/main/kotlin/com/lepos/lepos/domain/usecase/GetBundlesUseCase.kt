package com.lepos.lepos.domain.usecase

import com.lepos.lepos.core.Result
import com.lepos.lepos.domain.model.bundle.Bundle
import com.lepos.lepos.domain.repository.BundleRepository

class GetBundlesUseCase(
    private val repository: BundleRepository
) {
    suspend operator fun invoke(): Result<List<Bundle>> {
        return repository.getBundles()
    }
}

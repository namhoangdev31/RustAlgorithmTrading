package com.lepos.lepos.domain.usecase

import com.lepos.lepos.core.Result
import com.lepos.lepos.domain.model.bundle.BundleStats
import com.lepos.lepos.domain.repository.BundleRepository

class GetBundleStatsUseCase(
    private val repository: BundleRepository
) {
    suspend operator fun invoke(bundleId: String): Result<BundleStats?> {
        return repository.getBundleStats(bundleId)
    }
}

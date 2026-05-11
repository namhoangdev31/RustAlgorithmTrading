package com.lepos.lepos.domain.usecase

import com.lepos.lepos.core.Result
import com.lepos.lepos.domain.model.bundle.BundlePromotion
import com.lepos.lepos.domain.repository.BundleRepository

class GetBundlePromotionsUseCase(
    private val repository: BundleRepository
) {
    suspend operator fun invoke(bundleId: String): Result<List<BundlePromotion>> {
        return repository.getBundlePromotions(bundleId)
    }
}

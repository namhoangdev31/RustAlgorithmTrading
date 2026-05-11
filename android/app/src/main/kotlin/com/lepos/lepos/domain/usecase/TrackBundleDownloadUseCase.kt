package com.lepos.lepos.domain.usecase

import com.lepos.lepos.core.Result
import com.lepos.lepos.domain.repository.BundleRepository

class TrackBundleDownloadUseCase(
    private val repository: BundleRepository
) {
    suspend operator fun invoke(bundleId: String): Result<Unit> {
        return repository.trackDownload(bundleId)
    }
}

package com.lepos.lepos.domain.usecase

import com.lepos.lepos.core.Result
import com.lepos.lepos.domain.model.bundle.Bundle
import com.lepos.lepos.domain.port.BundleDownloader
import com.lepos.lepos.domain.repository.BundleRepository

class DownloadBundleUseCase(
    private val repository: BundleRepository,
    private val downloader: BundleDownloader
) {
    /**
     * Downloads a bundle and returns the local path to it.
     */
    suspend operator fun invoke(bundle: Bundle): Result<String> {
        return repository.getDownloadUrl(bundle.id).onSuccess { url ->
            val result = downloader.download(url, bundle.id)
            if (result is Result.Error) {
                 return Result.Error(result.error)
            }
            // If downloader returns success, it contains the path
            return result
        }
        // If getDownloadUrl failed, return that error
    }
}

package com.lepos.lepos.data.repository

import com.lepos.lepos.core.AppError
import com.lepos.lepos.core.Result
import com.lepos.lepos.data.mapper.toDomain
import com.lepos.lepos.data.remote.BundleApiService
import com.lepos.lepos.domain.model.bundle.Bundle
import com.lepos.lepos.domain.repository.BundleRepository

class BundleRepositoryImpl(
    private val apiService: BundleApiService,
    // Add DispatcherProvider if needed for IO context switching, though Ktor is async
) : BundleRepository {

    override suspend fun getBundles(): Result<List<Bundle>> {
        return try {
            val dtos = apiService.getBundles()
            val domainModels = dtos.map { it.toDomain() }
            Result.Success(domainModels)
        } catch (e: Exception) {
            Result.Error(AppError.NetworkError(message = e.message, cause = e))
        }
    }

    override suspend fun getDownloadUrl(bundleId: String): Result<String> {
        return try {
            val url = apiService.getDownloadUrl(bundleId)
            Result.Success(url)
        } catch (e: Exception) {
            Result.Error(AppError.UnknownError(message = e.message, cause = e))
        }
    }

    override suspend fun getBundleStats(bundleId: String): Result<com.lepos.lepos.domain.model.bundle.BundleStats?> {
        return try {
            Result.Success(apiService.getBundleStats(bundleId))
        } catch (e: Exception) {
            Result.Error(AppError.NetworkError(message = e.message, cause = e))
        }
    }

    override suspend fun getBundleIAPs(bundleId: String): Result<List<com.lepos.lepos.domain.model.bundle.BundleInAppPurchase>> {
        return try {
            Result.Success(apiService.getBundleIAPs(bundleId))
        } catch (e: Exception) {
            Result.Error(AppError.NetworkError(message = e.message, cause = e))
        }
    }

    override suspend fun getBundlePromotions(bundleId: String): Result<List<com.lepos.lepos.domain.model.bundle.BundlePromotion>> {
        return try {
            Result.Success(apiService.getBundlePromotions(bundleId))
        } catch (e: Exception) {
            Result.Error(AppError.NetworkError(message = e.message, cause = e))
        }
    }

    override suspend fun validatePromoCode(code: String): Result<com.lepos.lepos.domain.model.bundle.BundlePromotion?> {
        return try {
            Result.Success(apiService.validatePromoCode(code))
        } catch (e: Exception) {
            Result.Error(AppError.NetworkError(message = e.message, cause = e))
        }
    }

    override suspend fun trackDownload(bundleId: String): Result<Unit> {
        return try {
            apiService.trackDownload(bundleId)
            Result.Success(Unit)
        } catch (e: Exception) {
            Result.Error(AppError.NetworkError(message = e.message, cause = e))
        }
    }
}

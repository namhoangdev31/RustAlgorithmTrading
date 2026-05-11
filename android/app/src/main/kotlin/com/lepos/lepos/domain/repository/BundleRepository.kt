package com.lepos.lepos.domain.repository

import com.lepos.lepos.core.Result
import com.lepos.lepos.domain.model.bundle.Bundle

interface BundleRepository {
    suspend fun getBundles(): Result<List<Bundle>>
    suspend fun getDownloadUrl(bundleId: String): Result<String>
    suspend fun getBundleStats(bundleId: String): Result<com.lepos.lepos.domain.model.bundle.BundleStats?>
    suspend fun getBundleIAPs(bundleId: String): Result<List<com.lepos.lepos.domain.model.bundle.BundleInAppPurchase>>
    suspend fun getBundlePromotions(bundleId: String): Result<List<com.lepos.lepos.domain.model.bundle.BundlePromotion>>
    suspend fun validatePromoCode(code: String): Result<com.lepos.lepos.domain.model.bundle.BundlePromotion?>
    suspend fun trackDownload(bundleId: String): Result<Unit>
}

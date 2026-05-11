package com.lepos.lepos.data.remote

import com.lepos.lepos.domain.model.bundle.*
import com.lepos.lepos.data.dto.BundleDto
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.get
import io.ktor.client.request.post
import io.ktor.client.request.parameter

class BundleApiService(
    private val client: HttpClient
) {
    suspend fun getBundles(): List<BundleDto> =
        client.get("bundles").body()

    fun getDownloadUrl(bundleId: String): String =
        "bundles/$bundleId/download"

    suspend fun getBundleStats(bundleId: String): BundleStats? =
        client.get("bundles/$bundleId/stats").body()

    suspend fun getBundleIAPs(bundleId: String): List<BundleInAppPurchase> =
        client.get("bundles/$bundleId/iaps").body()

    suspend fun getBundlePromotions(bundleId: String): List<BundlePromotion> =
        client.get("bundles/$bundleId/promotions").body()

    suspend fun validatePromoCode(code: String): BundlePromotion? =
        client.post("bundles/promotions/validate") {
            parameter("code", code)
        }.body()

    suspend fun trackDownload(bundleId: String): Unit {
        client.post("bundles/$bundleId/download")
    }
}

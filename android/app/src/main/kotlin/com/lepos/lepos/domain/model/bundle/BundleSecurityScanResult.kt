package com.lepos.lepos.domain.model.bundle

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundleSecurityScanResult(
    val id: String,
    val bundleId: String,
    val versionId: String?,
    val scanType: String,
    val result: String,
    val severity: String?,
    val findings: String?, // JSON
    val scannedAt: Instant,
    val scannerVersion: String?
)

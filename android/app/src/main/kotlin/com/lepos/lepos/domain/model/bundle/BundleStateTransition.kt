package com.lepos.lepos.domain.model.bundle

import kotlin.time.Instant
import kotlin.time.ExperimentalTime
import kotlinx.serialization.Serializable

@OptIn(ExperimentalTime::class)
@Serializable
data class BundleStateTransition(
    val id: String,
    val bundleId: String,
    val fromState: String,
    val toState: String,
    val trigger: String,
    val triggeredBy: String?,
    val metadata: String?, // JSON
    val createdAt: Instant
)

package com.lepos.lepos.domain.model

import kotlinx.serialization.Serializable

@Serializable
data class WebRuntimeManifest(
    val id: String,
    val version: String,
    val name: String,
    val entry: String,
    val type: RuntimeType,
    val orientation: String = "portrait",
    val fullScreen: Boolean = true
)

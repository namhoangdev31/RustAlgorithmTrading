package com.lepos.lepos.runtime

import kotlinx.serialization.Serializable

@Serializable
sealed class WebRuntimeState {
    @Serializable
    object Idle : WebRuntimeState()
    
    @Serializable
    object Loading : WebRuntimeState()
    
    @Serializable
    data class Ready(val entryUrl: String) : WebRuntimeState()
    
    @Serializable
    data class Error(val message: String, val code: Int? = null) : WebRuntimeState()
}

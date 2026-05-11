package com.lepos.lepos.domain.services

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

/**
 * Service to manage the installation state of Mini Apps.
 * This is a simulated in-memory implementation for the prototype.
 */
object AppInstallationService {
    private val _installedApps = MutableStateFlow<Set<String>>(emptySet())
    val installedApps: StateFlow<Set<String>> = _installedApps.asStateFlow()

    fun isAppInstalled(appId: String): Boolean {
        return _installedApps.value.contains(appId)
    }

    fun installApp(appId: String) {
        _installedApps.update { it + appId }
    }

    fun uninstallApp(appId: String) {
        _installedApps.update { it - appId }
    }
}

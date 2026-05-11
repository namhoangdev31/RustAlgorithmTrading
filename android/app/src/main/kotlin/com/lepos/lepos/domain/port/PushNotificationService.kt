package com.lepos.lepos.domain.port

interface PushNotificationService {
    /**
     * Retrieves the Firebase Cloud Messaging Token for the current platform.
     * Returns null if permission is denied or the token cannot be retrieved.
     */
    suspend fun getPushToken(): String?

    /**
     * Requests permission from the user to display notifications.
     */
    suspend fun requestPermission(): Boolean
}

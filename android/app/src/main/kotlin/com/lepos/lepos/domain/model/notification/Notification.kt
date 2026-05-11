package com.lepos.lepos.domain.model.notification

import com.lepos.lepos.enum.NotificationType
import com.lepos.lepos.enum.Platform
import kotlin.time.ExperimentalTime
import kotlin.time.Instant

data class Notification @OptIn(ExperimentalTime::class) constructor(
    val id: String,
    val title: String,
    val body: String?,
    val type: NotificationType,
    val isRead: Boolean,
    val readAt: Instant?,
    val recipientId: String,
    val actorId: String?,
    val resourceId: String?,
    val resourceType: String?,
    val metadata: String?, // JSON
    val createdAt: Instant,
    val updatedAt: Instant,
    val deletedAt: Instant?
)

data class UserDeviceToken @OptIn(ExperimentalTime::class) constructor(
    val id: String,
    val userId: String,
    val fcmToken: String,
    val platform: Platform,
    val deviceModel: String?,
    val osVersion: String?,
    val isActive: Boolean,
    val createdAt: Instant,
    val updatedAt: Instant
)

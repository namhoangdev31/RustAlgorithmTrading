package com.lepos.lepos.domain.model.comunity

import com.lepos.lepos.enum.GroupMemberRole
import kotlin.time.ExperimentalTime
import kotlin.time.Instant

data class CommunityGroup @OptIn(ExperimentalTime::class) constructor(
    val id: String,
    val name: String,
    val description: String,
    val icon: String?,
    val memberCount: Int,
    val postCount: Int,
    val createdAt: Instant,
    val updatedAt: Instant
)

data class GroupMember @OptIn(ExperimentalTime::class) constructor(
    val id: String,
    val groupId: String,
    val userId: String,
    val role: GroupMemberRole,
    val joinedAt: Instant
)

data class GroupPost @OptIn(ExperimentalTime::class) constructor(
    val id: String,
    val groupId: String,
    val userId: String,
    val content: String,
    val images: List<String>?,
    val likeCount: Int,
    val commentCount: Int,
    val createdAt: Instant,
    val updatedAt: Instant,
    val deletedAt: Instant?
)

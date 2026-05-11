package com.lepos.lepos.domain.model.file

data class File(
    val id: String,
    val path: String,
    val bucket: String?,
    val size: Long?,
    val contentType: String?,
    val filename: String?,
    val mimetype: String?
)

package com.lepos.lepos.data.mapper

import com.lepos.lepos.data.dto.UserDto
import com.lepos.lepos.domain.model.User

fun UserDto.toDomain(): User {
    return User(
        id = id,
        name = name
    )
}

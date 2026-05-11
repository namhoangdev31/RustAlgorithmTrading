package com.lepos.lepos.runtime

import com.lepos.lepos.domain.model.RuntimeType
import kotlinx.serialization.Serializable

@Serializable
object RuntimeInjector {
    fun getCssInjection(type: RuntimeType): String {
        return if (type == RuntimeType.STANDARD) {
            """
            body {
                -webkit-touch-callout: none;
                -webkit-user-select: none;
                overscroll-behavior-y: none;
            }
            """.trimIndent()
        } else ""
    }
}
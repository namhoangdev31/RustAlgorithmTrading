package com.lepos.lepos.enum

import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder

@Serializable(with = StatusEnumSerializer::class)
enum class StatusEnum(val value: Int) {
    ACTIVE(1),
    INACTIVE(2),
    SUSPENDED(3),
    DELETED(4),
    PROFILE_INCOMPLETE(5),
    PROFILE_COMPLETED(6);

    companion object {
        fun fromInt(value: Int) = entries.firstOrNull { it.value == value } ?: ACTIVE
    }
}

object StatusEnumSerializer : KSerializer<StatusEnum> {
    override val descriptor: SerialDescriptor = PrimitiveSerialDescriptor("StatusEnum", PrimitiveKind.INT)

    override fun serialize(encoder: Encoder, value: StatusEnum) {
        encoder.encodeInt(value.value)
    }

    override fun deserialize(decoder: Decoder): StatusEnum {
        val value = decoder.decodeInt()
        return StatusEnum.fromInt(value)
    }
}
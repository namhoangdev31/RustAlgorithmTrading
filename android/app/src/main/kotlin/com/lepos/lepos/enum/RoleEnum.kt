package com.lepos.lepos.enum

import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder

@Serializable(with = RoleEnumSerializer::class)
enum class RoleEnum(val value: Int) {
    ADMIN(1),
    INDIVIDUAL(2),
    DEALER(3),
    BROKER(4),
    INSPECTOR(5);

    companion object {
        fun fromInt(value: Int) = entries.firstOrNull { it.value == value } ?: INDIVIDUAL
    }
}

object RoleEnumSerializer : KSerializer<RoleEnum> {
    override val descriptor: SerialDescriptor = PrimitiveSerialDescriptor("RoleEnum", PrimitiveKind.INT)

    override fun serialize(encoder: Encoder, value: RoleEnum) {
        encoder.encodeInt(value.value)
    }

    override fun deserialize(decoder: Decoder): RoleEnum {
        val value = decoder.decodeInt()
        return RoleEnum.fromInt(value)
    }
}
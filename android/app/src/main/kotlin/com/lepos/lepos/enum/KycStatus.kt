package com.lepos.lepos.enum

enum class KycStatus(val value: String) {
    DRAFT("draft"),
    PROCESSING("processing"),
    MANUAL_REVIEW("manual_review"),
    VERIFIED("verified"),
    REJECTED("rejected"),
    NOT_VERIFIED("not_verified");
    
    companion object {
        fun fromString(value: String?): KycStatus? {
            return values().find { it.value == value }
        }
    }
}

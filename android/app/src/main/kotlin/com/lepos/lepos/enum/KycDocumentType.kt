package com.lepos.lepos.enum

enum class KycDocumentType(val value: String) {
    IDENTITY_FRONT("id_front"),
    IDENTITY_BACK("id_back"),
    PORTRAIT("selfie"),
    BUSINESS_LICENSE("business_license");
    
    companion object {
        fun fromValue(value: String): KycDocumentType? {
            return entries.find { it.value == value }
        }
    }
}

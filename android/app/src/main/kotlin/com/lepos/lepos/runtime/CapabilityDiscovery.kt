package com.lepos.lepos.runtime

enum class CapabilitySupport {
    NATIVE,   // Fully native implementation
    PROXY,    // Proxied to native via bridge
    UNSUPPORTED
}

data class RuntimeCapabilities(
    val bluetooth: CapabilitySupport,
    val nfc: CapabilitySupport,
    val biometrics: CapabilitySupport,
    val share: CapabilitySupport,
    val vibrate: CapabilitySupport,
    val clipboard: CapabilitySupport,
    val camera: CapabilitySupport,
    val geolocation: CapabilitySupport
) {
    fun toJson(): String {
        return """
        {
            "bluetooth": "${bluetooth.name.lowercase()}",
            "nfc": "${nfc.name.lowercase()}",
            "biometrics": "${biometrics.name.lowercase()}",
            "share": "${share.name.lowercase()}",
            "vibrate": "${vibrate.name.lowercase()}",
            "clipboard": "${clipboard.name.lowercase()}",
            "camera": "${camera.name.lowercase()}",
            "geolocation": "${geolocation.name.lowercase()}"
        }
        """.trimIndent()
    }
}

object PlatformCapabilities {
    fun getCapabilities(): RuntimeCapabilities {
        return RuntimeCapabilities(
            bluetooth = CapabilitySupport.UNSUPPORTED,    // Future: PROXY
            nfc = CapabilitySupport.UNSUPPORTED,          // Future: PROXY
            biometrics = CapabilitySupport.UNSUPPORTED,   // Future: NATIVE
            share = CapabilitySupport.NATIVE,             // ✅ Implemented
            vibrate = CapabilitySupport.NATIVE,           // ✅ Implemented
            clipboard = CapabilitySupport.NATIVE,         // ✅ Implemented
            camera = CapabilitySupport.UNSUPPORTED,
            geolocation = CapabilitySupport.UNSUPPORTED
        )
    }
}

package com.lepos.lepos.ui.webruntime

import io.ktor.server.application.*
import io.ktor.server.cio.*
import io.ktor.server.engine.*
import io.ktor.server.http.content.*
import io.ktor.server.routing.*
import io.ktor.http.ContentType
import java.io.File

/**
 * Android-specific embedded HTTP server using Ktor CIO.
 * Serves web bundles from local filesystem with SPA fallback routing.
 */
class AndroidWebServer(
    private val port: Int = 8080,
    private val basePath: String
) {
    private var engine: EmbeddedServer<*, *>? = null

    /**
     * Start the embedded server.
     * Safe to call multiple times - will not restart if already running.
     */
    fun start() {
        if (engine != null) {
            android.util.Log.d("AndroidWebServer", "Server already running on port $port")
            return
        }

        try {
            engine = embeddedServer(CIO, port = port) {
                routing {
                    // Serve static files from the local filesystem
                    staticFiles("/", File(basePath)) {
                        // SPA Fallback: All routes return index.html
                        default("index.html")
                        
                        // Fix MIME types for Flutter Web / WASM
                        contentType { file ->
                            when (file.extension) {
                                "wasm" -> ContentType.parse("application/wasm")
                                "mjs" -> ContentType.Text.JavaScript
                                else -> null
                            }
                        }
                    }
                }
            }.also {
                it.start(wait = false)
                android.util.Log.d("AndroidWebServer", "Server started on http://127.0.0.1:$port serving $basePath")
            }
        } catch (e: Exception) {
            android.util.Log.e("AndroidWebServer", "Failed to start server: ${e.message}")
            throw e
        }
    }

    /**
     * Stop the embedded server.
     * Graceful shutdown with timeout.
     */
    fun stop() {
        engine?.let {
            android.util.Log.d("AndroidWebServer", "Stopping server...")
            it.stop(gracePeriodMillis = 1000, timeoutMillis = 2000)
            engine = null
            android.util.Log.d("AndroidWebServer", "Server stopped")
        }
    }

    /**
     * Check if server is currently running.
     */
    fun isRunning(): Boolean = engine != null
}

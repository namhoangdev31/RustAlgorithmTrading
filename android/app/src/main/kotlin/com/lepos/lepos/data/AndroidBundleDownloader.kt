package com.lepos.lepos.data

import android.content.Context
import com.lepos.lepos.core.AppError
import com.lepos.lepos.core.DispatcherProvider
import com.lepos.lepos.core.Result
import com.lepos.lepos.domain.port.BundleDownloader
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.net.URL
import java.util.zip.ZipInputStream

class AndroidBundleDownloader(
    private val context: Context,
    private val dispatchers: DispatcherProvider,
    private val baseUrl: String
) : BundleDownloader {

    override suspend fun download(url: String, bundleId: String): Result<String> {
        return withContext(dispatchers.io) {
            try {
                val finalUrl = if (url.startsWith("http")) url else {
                    val normalizedBase = if (baseUrl.endsWith("/")) baseUrl else "$baseUrl/"
                    "$normalizedBase$url"
                }
                
                // Define bundle directory
                val bundleDir = File(context.filesDir, "bundles/$bundleId")
                if (bundleDir.exists()) {
                    bundleDir.deleteRecursively()
                }
                bundleDir.mkdirs()

                // Download & Unzip
                URL(finalUrl).openStream().use { input ->
                    ZipInputStream(input).use { zip ->
                        var entry = zip.nextEntry
                        while (entry != null) {
                            val file = File(bundleDir, entry.name)
                            if (entry.isDirectory) {
                                file.mkdirs()
                            } else {
                                file.parentFile?.mkdirs()
                                FileOutputStream(file).use { output ->
                                    zip.copyTo(output)
                                }
                            }
                            entry = zip.nextEntry
                        }
                    }
                }

                // Return absolute path
                Result.Success(bundleDir.absolutePath)

            } catch (e: Exception) {
                Result.Error(AppError.UnknownError(message = e.message, cause = e))
            }
        }
    }
}

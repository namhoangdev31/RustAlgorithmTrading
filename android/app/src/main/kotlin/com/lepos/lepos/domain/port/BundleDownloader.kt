package com.lepos.lepos.domain.port

import com.lepos.lepos.core.Result

interface BundleDownloader {
    /**
     * Downloads a bundle from [url] and extracts it.
     * @return Result containing the absolute path to the extracted bundle directory.
     */
    suspend fun download(url: String, bundleId: String): Result<String>
}

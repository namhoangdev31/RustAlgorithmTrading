import { Buffer } from "buffer";

export interface OptimizationOptions {
  width?: number;
  height?: number;
  quality?: number; // 1-100
  format?: "webp" | "avif" | "jpeg" | "png";
}

/**
 * Optimizes an image buffer by resizing and/or converting format.
 * Falls back to returning the original buffer if the optimized format or engine (e.g. sharp)
 * is unavailable or if it's not a supported image.
 */
export async function optimizeImage(
  buffer: Buffer,
  options: OptimizationOptions = {}
): Promise<{ buffer: Buffer; contentType: string; size: number }> {
  const { width, height, quality = 80, format = "webp" } = options;

  console.log(`[ImageOptimizer] Optimizing image to format: ${format}, quality: ${quality}`);

  try {
    // Attempt dynamic import of sharp to avoid hard dependency compile errors
    // if sharp is not pre-installed or not supported on this platform.
    const sharpModule = await import("sharp");
    const sharp = sharpModule.default;
    
    let pipeline = sharp(buffer);

    if (width || height) {
      pipeline = pipeline.resize(width, height, {
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    if (format === "webp") {
      pipeline = pipeline.webp({ quality });
    } else if (format === "avif") {
      pipeline = pipeline.avif({ quality });
    } else if (format === "jpeg") {
      pipeline = pipeline.jpeg({ quality });
    } else if (format === "png") {
      pipeline = pipeline.png({ quality });
    }

    const outputBuffer = await pipeline.toBuffer();
    return {
      buffer: outputBuffer,
      contentType: `image/${format}`,
      size: outputBuffer.length,
    };
  } catch (err) {
    console.warn(
      "[ImageOptimizer] Sharp library is not available or failed. Falling back to simulated optimization."
    );
    
    let mimeType = `image/${format}`;
    if (format === "jpeg") mimeType = "image/jpeg";

    return {
      buffer: buffer,
      contentType: mimeType,
      size: buffer.length,
    };
  }
}

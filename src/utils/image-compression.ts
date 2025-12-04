import { ImageMagick, initializeImageMagick } from '@imagemagick/magick-wasm'

let isInitialized = false

/**
 * Initialize ImageMagick WASM (call once at app startup)
 */
export async function initImageMagick() {
  if (isInitialized) return

  const wasmLocation = new URL(
    '@imagemagick/magick-wasm/magick.wasm',
    import.meta.url
  )

  await initializeImageMagick(wasmLocation)
  isInitialized = true
  console.log('[ImageMagick] Initialized')
}

export type CompressionOptions = {
  maxWidth?: number
  maxHeight?: number
}

export type CompressionResult = {
  base64data: string
  width: number
  height: number
  originalSize: number
  compressedSize: number
  compressionRatio: number
  format: string
}

/**
 * Compresses an image using ImageMagick WASM
 * Supports all input formats (HEIC, GIF, PNG, JPEG, WebP, etc.)
 * Always outputs PNG for universal compatibility and transparency support
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 2048,
    maxHeight = 2048,
  } = options

  // Ensure ImageMagick is initialized
  await initImageMagick()

  // Read file as ArrayBuffer
  const arrayBuffer = await file.arrayBuffer()
  const inputData = new Uint8Array(arrayBuffer)

  return new Promise((resolve) => {
    ImageMagick.read(inputData, img => {
      const { width, height } = img

      // Calculate new dimensions while maintaining aspect ratio
      let newWidth = width
      let newHeight = height

      if (width > maxWidth || height > maxHeight) {
        const aspectRatio = width / height

        if (width > height) {
          newWidth = Math.min(width, maxWidth)
          newHeight = Math.round(newWidth / aspectRatio)
        } else {
          newHeight = Math.min(height, maxHeight)
          newWidth = Math.round(newHeight * aspectRatio)
        }

        // Resize the image
        img.resize(newWidth, newHeight)
      }

      // Always output as PNG for universal compatibility and transparency support
      let outputData: Uint8Array
      img.write('PNG', (data: Uint8Array) => (outputData = data))
      const mimeType = 'image/png'

      // Convert to base64
      const base64 = arrayBufferToBase64(outputData!)
      const base64data = `data:${mimeType};base64,${base64}`

      const originalSize = file.size
      const compressedSize = outputData!.length

      console.log('[Image Compression]', {
        originalSize: formatBytes(originalSize),
        compressedSize: formatBytes(compressedSize),
        compressionRatio: `${Math.round((compressedSize / originalSize) * 100)}%`,
        format: 'PNG',
        dimensions: `${newWidth}x${newHeight}`,
        originalDimensions: `${width}x${height}`,
        hasTransparency: img.hasAlpha,
        wasResized: newWidth !== width || newHeight !== height,
      })

      resolve({
        base64data,
        width: newWidth,
        height: newHeight,
        originalSize,
        compressedSize,
        compressionRatio: compressedSize / originalSize,
        format: mimeType,
      })
    })
  })
}

/**
 * Converts Uint8Array to base64 string
 */
function arrayBufferToBase64(buffer: Uint8Array): string {
  let binary = ''
  const len = buffer.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i])
  }
  return btoa(binary)
}

/**
 * Formats bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Checks if localStorage has enough space for the data
 */
export function checkLocalStorageQuota(dataSize: number): {
  hasSpace: boolean
  estimatedUsage: number
  estimatedLimit: number
} {
  const estimatedLimit = 5 * 1024 * 1024 // 5MB typical limit

  // Calculate current usage
  let currentUsage = 0
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      currentUsage += localStorage[key].length + key.length
    }
  }

  const estimatedUsageAfter = currentUsage + dataSize

  return {
    hasSpace: estimatedUsageAfter < estimatedLimit * 0.9, // Keep 10% buffer
    estimatedUsage: currentUsage,
    estimatedLimit,
  }
}

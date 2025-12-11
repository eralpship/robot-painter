import { ImageMagick, initializeImageMagick } from '@imagemagick/magick-wasm'

let isInitialized = false

/**
 * Default maximum dimensions for image compression
 * Images larger than these dimensions will be resized while maintaining aspect ratio
 */
export const DEFAULT_MAX_IMAGE_WIDTH = 512
export const DEFAULT_MAX_IMAGE_HEIGHT = DEFAULT_MAX_IMAGE_WIDTH

/**
 * Default PNG compression quality (0-100)
 * Higher = better quality but larger file size
 * 50 provides good balance for 512x512 max size (targets ~20-50KB)
 */
export const DEFAULT_PNG_QUALITY = 50

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
  quality?: number // 0-100, for PNG compression
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
 * Process SVG files by rasterizing them to PNG
 */
async function processSVG(
  file: File,
  options: { maxWidth: number; maxHeight: number; quality: number }
): Promise<CompressionResult> {
  const { maxWidth, maxHeight } = options

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async e => {
      try {
        const svgText = e.target?.result as string

        // Create an image element to load the SVG
        const img = new Image()

        img.onerror = () => reject(new Error('Failed to load SVG'))

        img.onload = () => {
          // Calculate dimensions while maintaining aspect ratio
          let width = img.width || maxWidth
          let height = img.height || maxHeight

          if (width > maxWidth || height > maxHeight) {
            const aspectRatio = width / height
            if (width > height) {
              width = Math.min(width, maxWidth)
              height = Math.round(width / aspectRatio)
            } else {
              height = Math.min(height, maxHeight)
              width = Math.round(height * aspectRatio)
            }
          }

          // Create canvas to rasterize SVG
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')

          if (!ctx) {
            reject(new Error('Failed to get canvas context'))
            return
          }

          // Draw SVG onto canvas
          ctx.drawImage(img, 0, 0, width, height)

          // Convert to PNG blob with aggressive compression
          // Quality 0.6 provides good balance for 512x512 max size
          canvas.toBlob(
            blob => {
              if (!blob) {
                reject(new Error('Failed to convert SVG to PNG'))
                return
              }

              const reader2 = new FileReader()
              reader2.onloadend = () => {
                const base64data = reader2.result as string
                const compressedSize = blob.size

                console.log('[SVG Processing]', {
                  originalSize: formatBytes(file.size),
                  compressedSize: formatBytes(compressedSize),
                  compressionRatio: `${Math.round((compressedSize / file.size) * 100)}%`,
                  format: 'PNG',
                  dimensions: `${width}x${height}`,
                  targetMaxSize: '~50KB for 512x512',
                })

                resolve({
                  base64data,
                  width,
                  height,
                  originalSize: file.size,
                  compressedSize,
                  compressionRatio: compressedSize / file.size,
                  format: 'image/png',
                })
              }
              reader2.onerror = () => reject(new Error('Failed to read PNG blob'))
              reader2.readAsDataURL(blob)
            },
            'image/png',
            0.6 // Lower quality for smaller file size
          )
        }

        // Create blob URL from SVG text
        const svgBlob = new Blob([svgText], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(svgBlob)
        img.src = url

        // Note: We don't revoke the URL here because img.onload needs it
        // It will be revoked automatically when the page unloads
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => reject(new Error('Failed to read SVG file'))
    reader.readAsText(file)
  })
}

/**
 * Compresses an image using ImageMagick WASM
 * Supports all input formats (HEIC, GIF, PNG, JPEG, WebP, SVG, etc.)
 * Always outputs PNG for universal compatibility and transparency support
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = DEFAULT_MAX_IMAGE_WIDTH,
    maxHeight = DEFAULT_MAX_IMAGE_HEIGHT,
    quality = DEFAULT_PNG_QUALITY,
  } = options

  // Handle SVG files specially - rasterize them to PNG
  if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
    return await processSVG(file, { maxWidth, maxHeight, quality })
  }

  // Ensure ImageMagick is initialized
  await initImageMagick()

  // Read file as ArrayBuffer
  const arrayBuffer = await file.arrayBuffer()
  const inputData = new Uint8Array(arrayBuffer)

  return new Promise((resolve, reject) => {
    try {
      ImageMagick.read(inputData, img => {
        try {
          // For GIFs and multi-frame images, only the first frame is processed
          // This converts animated GIFs to static PNG

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

          // Set compression quality (0-100)
          // Lower quality significantly reduces file size for 512x512 images
          img.quality = quality

          // Strip metadata to reduce file size
          img.strip()

          // Always output as PNG for universal compatibility and transparency support
          // Note: For GIFs, ImageMagick.read() automatically reads only the first frame
          let outputData: Uint8Array | undefined
          img.write('PNG', (data: Uint8Array) => {
            console.log(
              '[ImageMagick] PNG write callback - data length:',
              data.length
            )
            console.log(
              '[ImageMagick] PNG write callback - first 16 bytes:',
              Array.from(data.slice(0, 16))
            )
            // IMPORTANT: Copy the data! ImageMagick may reuse the buffer
            outputData = new Uint8Array(data)
          })

          if (!outputData || outputData.length === 0) {
            throw new Error('Failed to generate PNG output - data is empty')
          }

          console.log(
            '[ImageMagick] Total output data length:',
            outputData.length
          )
          console.log(
            '[ImageMagick] PNG signature check (should be [137, 80, 78, 71]):',
            Array.from(outputData.slice(0, 4))
          )

          const mimeType = 'image/png'

          // Convert to base64
          const base64 = arrayBufferToBase64(outputData)
          console.log('[ImageMagick] Base64 length:', base64.length)
          console.log(
            '[ImageMagick] Base64 first 50 chars:',
            base64.substring(0, 50)
          )

          const base64data = `data:${mimeType};base64,${base64}`

          // Validate base64 data
          if (!base64data || base64data.length < 100) {
            throw new Error('Invalid base64 data generated')
          }

          const originalSize = file.size
          const compressedSize = outputData.length

          console.log('[Image Compression]', {
            originalSize: formatBytes(originalSize),
            compressedSize: formatBytes(compressedSize),
            compressionRatio: `${Math.round((compressedSize / originalSize) * 100)}%`,
            format: 'PNG',
            quality: quality,
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
        } catch (error) {
          console.error('[ImageMagick] Error processing image:', error)
          reject(error)
        }
      })
    } catch (error) {
      console.error('[ImageMagick] Error reading image:', error)
      reject(error)
    }
  })
}

/**
 * Converts Uint8Array to base64 string
 * Uses chunked approach to handle large arrays without stack overflow
 */
function arrayBufferToBase64(buffer: Uint8Array): string {
  // For smaller buffers, use the simple approach
  if (buffer.length < 1024 * 1024) {
    // Convert to binary string using reduce to avoid stack overflow
    let binary = ''
    const chunkSize = 8192
    for (let i = 0; i < buffer.length; i += chunkSize) {
      const chunk = buffer.subarray(i, Math.min(i + chunkSize, buffer.length))
      // Use Array.from to properly handle the bytes
      binary += String.fromCharCode(...Array.from(chunk))
    }
    return btoa(binary)
  }

  // For very large buffers, use a different approach
  let binary = ''
  for (let i = 0; i < buffer.length; i++) {
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

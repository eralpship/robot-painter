import { TextureEditorContext, CANVAS_SIZE } from '@/contexts/texture-editor-context'
import { useContext } from 'react'
import {
  compressImage,
  checkLocalStorageQuota,
  formatBytes,
  DEFAULT_MAX_IMAGE_WIDTH,
  DEFAULT_MAX_IMAGE_HEIGHT,
} from '@/utils/image-compression'

export function AddElementToolbar() {
  const ctx = useContext(TextureEditorContext)
  return (
    <>
      <button
        onClick={() => {
          ctx.addElement({
            type: 'text',
            text: 'Sample Text',
            fontSize: 192,
            color: '#000000',
            transform: {
              centerX: ctx.center.x,
              centerY: ctx.center.y,
              rotation: 0,
              scaleX: 1,
              scaleY: 1,
            },
            side: ctx.side,
          })
        }}
        style={{
          cursor: 'pointer',
        }}
      >
        add text
      </button>
      <button
        onClick={() => {
          const input = document.createElement('input')
          input.type = 'file'
          input.accept = 'image/*'
          input.style.display = 'none'

          // Append to DOM for Safari compatibility
          document.body.appendChild(input)

          input.onchange = async e => {
            const file = (e.target as HTMLInputElement).files?.[0]

            if (file) {
              // Add file size validation for Safari memory limits
              const maxSize = 10 * 1024 * 1024 // 10MB limit
              if (file.size > maxSize) {
                console.error('File too large:', file.size, 'bytes')
                alert(`Image file is too large. Please use an image smaller than ${maxSize / 1024 / 1024}MB`)
                document.body.removeChild(input)
                return
              }

              console.log('Loading image:', file.name, 'Size:', formatBytes(file.size), 'Type:', file.type)

              try {
                // Compress the image using ImageMagick WASM (converts all formats to PNG)
                const compressed = await compressImage(file, {
                  maxWidth: DEFAULT_MAX_IMAGE_WIDTH,
                  maxHeight: DEFAULT_MAX_IMAGE_HEIGHT,
                })

                // Check localStorage quota
                const quota = checkLocalStorageQuota(compressed.base64data.length)
                if (!quota.hasSpace) {
                  alert(
                    `Not enough space in localStorage. Current usage: ${formatBytes(quota.estimatedUsage)}. ` +
                    `This image would add ${formatBytes(compressed.compressedSize)}. ` +
                    `Please remove some elements or use a smaller image.`
                  )
                  document.body.removeChild(input)
                  return
                }

                // Calculate scale to fit image within 60% of canvas width
                const maxDisplayWidth = CANVAS_SIZE * 0.6
                const scaleFactor = compressed.width > maxDisplayWidth ? maxDisplayWidth / compressed.width : 1

                ctx.addElement({
                  type: 'image',
                  base64data: compressed.base64data,
                  transform: {
                    centerX: ctx.center.x,
                    centerY: ctx.center.y,
                    rotation: 0,
                    scaleX: scaleFactor,
                    scaleY: scaleFactor,
                  },
                  width: compressed.width,
                  height: compressed.height,
                  side: ctx.side,
                })
                console.log('Image element added to context')
              } catch (error) {
                console.error('Failed to process image:', error)
                alert('Failed to load the image. The file might be corrupted or in an unsupported format.')
              } finally {
                document.body.removeChild(input)
              }
            } else {
              // Clean up if no file selected
              document.body.removeChild(input)
            }
          }

          // Trigger click after a small delay for Safari
          setTimeout(() => {
            input.click()
          }, 100)
        }}
        style={{
          cursor: 'pointer',
        }}
      >
        add image
      </button>
    </>
  )
}

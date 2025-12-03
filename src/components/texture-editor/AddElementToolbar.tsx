import { TextureEditorContext } from '@/contexts/texture-editor-context'
import { useContext } from 'react'

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

          input.onchange = e => {
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

              console.log('Loading image:', file.name, 'Size:', file.size, 'Type:', file.type)

              const reader = new FileReader()

              reader.onerror = (error) => {
                console.error('FileReader error:', error)
                alert('Failed to read the image file. Please try again.')
                document.body.removeChild(input)
              }

              reader.onload = () => {
                const result = reader.result as string
                console.log('FileReader completed, data URL length:', result?.length)

                const img = new Image()

                img.onerror = (error) => {
                  console.error('Image load error:', error)
                  alert('Failed to load the image. The file might be corrupted or in an unsupported format.')
                  document.body.removeChild(input)
                }

                img.onload = () => {
                  console.log('Image loaded successfully:', img.width, 'x', img.height)

                  try {
                    // Calculate scale to fit image within 60% of container width
                    const maxWidth = ctx.size.width * 0.6
                    const scaleFactor = img.width > maxWidth ? maxWidth / img.width : 1

                    ctx.addElement({
                      type: 'image',
                      base64data: result,
                      transform: {
                        centerX: ctx.center.x,
                        centerY: ctx.center.y,
                        rotation: 0,
                        scaleX: scaleFactor,
                        scaleY: scaleFactor,
                      },
                      width: img.width,
                      height: img.height,
                      side: ctx.side,
                    })
                    console.log('Image element added to context')
                  } catch (error) {
                    console.error('Failed to add image element:', error)
                    alert('Failed to add the image to the editor.')
                  }

                  document.body.removeChild(input)
                }

                // Set source after all handlers are attached
                img.src = result
              }

              reader.readAsDataURL(file)
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

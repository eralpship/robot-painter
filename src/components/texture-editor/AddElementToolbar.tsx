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
            rotation: 0,
            color: '#000000',
            position: ctx.center,
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
          input.onchange = e => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (file) {
              const reader = new FileReader()
              reader.onload = () => {
                ctx.addElement({
                  type: 'image',
                  position: ctx.center,
                  base64data: reader.result as string,
                  rotation: 0,
                })
              }
              reader.readAsDataURL(file)
            }
          }
          input.click()
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

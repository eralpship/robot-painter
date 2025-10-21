import { TextureEditorContext } from '@/contexts/texture-editor-context'
import { useContext } from 'react'

export function ElementToolbar() {
  const ctx = useContext(TextureEditorContext)
  return (
    <>
      <button
        onClick={() => {
          const element = ctx.selectedElement
          if (!element) {
            return
          }
          ctx.removeElement(element.uuid)
        }}
        style={{
          cursor: 'pointer',
        }}
      >
        remove
      </button>
    </>
  )
}

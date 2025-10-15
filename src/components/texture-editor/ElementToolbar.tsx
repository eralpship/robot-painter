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
          const input = window.prompt(
            'Enter rotation in degrees (negative allowed):',
            element.rotation.toString()
          )
          if (!input) {
            return
          }
          const rotation = parseFloat(input)
          if (isNaN(rotation)) {
            return
          }
          ctx.updateElement(element.uuid, { rotation })
        }}
        style={{
          cursor: 'pointer',
        }}
      >
        rotation
      </button>
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

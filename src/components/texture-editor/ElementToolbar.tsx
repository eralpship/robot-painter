import { TextureEditorContext } from '@/contexts/texture-editor-context'
import { useContext } from 'react'

export function ElementToolbar() {
  const ctx = useContext(TextureEditorContext)
  return (
    <>
      <button
        onClick={() => {
          if (!ctx.selectedElementId) {
            return
          }
          const element = ctx.elements.get(ctx.selectedElementId)
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
          const newRotation = parseFloat(input)
          if (isNaN(newRotation)) {
            return
          }
          ctx.setElementRotation({
            elementId: ctx.selectedElementId,
            rotation: newRotation,
          })
        }}
        style={{
          cursor: 'pointer',
        }}
      >
        rotation
      </button>
      <button
        onClick={() => {
          if (!ctx.selectedElementId) {
            return
          }
          ctx.removeElement(ctx.selectedElementId)
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

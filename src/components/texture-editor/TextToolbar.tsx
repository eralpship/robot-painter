import { TextureEditorContext } from '@/contexts/texture-editor-context'
import isEmpty from 'lodash/isEmpty'
import { useContext } from 'react'
import { hexColorRegex } from './utils/hexColorRegex'

export function TextToolbar() {
  const ctx = useContext(TextureEditorContext)
  return (
    <>
      <button
        onClick={() => {
          const element = ctx.selectedElement
          if (!element || element.type !== 'text') {
            return
          }
          const text = window.prompt('Enter new text:', element.text)
          if (!text || isEmpty(text)) {
            return
          }
          ctx.updateElement(element.uuid, { text })
        }}
        style={{
          cursor: 'pointer',
        }}
      >
        change text
      </button>
      <button
        onClick={() => {
          const element = ctx.selectedElement
          if (!element || element.type !== 'text') {
            return
          }
          const input = window.prompt(
            'Enter font size (number only):',
            element.fontSize.toString()
          )
          if (!input) {
            return
          }
          const fontSize = parseFloat(input)
          if (isNaN(fontSize) || fontSize <= 0) {
            return
          }
          ctx.updateElement(element.uuid, { fontSize })
        }}
        style={{
          cursor: 'pointer',
        }}
      >
        font size
      </button>
      <button
        onClick={() => {
          const element = ctx.selectedElement
          if (!element || element.type !== 'text') {
            return
          }
          const color = window.prompt(
            'Enter hex color (e.g., #ff0000, #000000):',
            element.color
          )
          if (!color) {
            return
          }
          if (!hexColorRegex.test(color)) {
            return
          }
          ctx.updateElement(element.uuid, { color })
        }}
        style={{
          cursor: 'pointer',
        }}
      >
        change color
      </button>
    </>
  )
}

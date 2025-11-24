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
          if (!element) {
            alert('Please select a text element first by clicking on it in the editor.')
            return
          }
          if (element.type !== 'text') {
            alert('The selected element is not a text element. Please select a text element.')
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
          if (!element) {
            alert('Please select a text element first by clicking on it in the editor.')
            return
          }
          if (element.type !== 'text') {
            alert('The selected element is not a text element. Please select a text element.')
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
            alert('Please enter a valid positive number for font size.')
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
          if (!element) {
            alert('Please select a text element first by clicking on it in the editor.')
            return
          }
          if (element.type !== 'text') {
            alert('The selected element is not a text element. Please select a text element.')
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
            alert('Please enter a valid hex color (e.g., #ff0000, #000000).')
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

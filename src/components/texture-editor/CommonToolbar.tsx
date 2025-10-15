import { TextureEditorContext } from '@/contexts/texture-editor-context'
import { useNavigate } from '@tanstack/react-router'
import { useContext } from 'react'
import { hexColorRegex } from './utils/hexColorRegex'

export function CommonToolbar() {
  const ctx = useContext(TextureEditorContext)
  const navigate = useNavigate()

  return (
    <>
      <button
        onClick={() => {
          navigate({
            to: ctx.mode === 'full' ? '/' : '/texture-editor',
          })
        }}
        style={{
          cursor: 'pointer',
        }}
      >
        {ctx.mode === 'full' ? 'robot editor' : 'texture editor'}
      </button>
      <button
        onClick={() => {
          const color = window.prompt(
            'Enter hex color (e.g., #ff0000, #000000):',
            ctx.backgroundColor
          )
          if (!color) {
            return
          }
          if (!hexColorRegex.test(color)) {
            return
          }
          ctx.setBackgroundColor(color)
        }}
        style={{
          cursor: 'pointer',
        }}
      >
        background
      </button>
      <button
        onClick={ctx.saveTexture}
        style={{
          cursor: 'pointer',
        }}
      >
        save
      </button>
      <button
        onClick={ctx.loadTexture}
        style={{
          cursor: 'pointer',
        }}
      >
        load
      </button>
    </>
  )
}

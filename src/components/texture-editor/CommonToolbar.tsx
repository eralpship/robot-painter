import { TextureEditorContext } from '@/contexts/texture-editor-context'
import { useNavigate } from '@tanstack/react-router'
import { debounce } from 'lodash'
import { useCallback, useContext, useEffect, useState } from 'react'

export function CommonToolbar() {
  const ctx = useContext(TextureEditorContext)
  const navigate = useNavigate()
  const [localColor, setLocalColor] = useState(ctx.backgroundColor)

  // Debounced function to update context
  const debouncedSetColor = useCallback(
    debounce((color: string) => {
      ctx.setBackgroundColor(color)
    }, 100),
    [ctx.setBackgroundColor]
  )

  // Sync local color when context changes
  useEffect(() => {
    setLocalColor(ctx.backgroundColor)
  }, [ctx.backgroundColor])

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
      <label
        style={{
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <span>background</span>
        <input
          type="color"
          value={localColor}
          onChange={(e) => {
            const newColor = e.target.value
            setLocalColor(newColor)
            debouncedSetColor(newColor)
          }}
          style={{
            cursor: 'pointer',
            width: '30px',
            height: '20px',
            border: 'none',
            borderRadius: '2px',
            padding: 0,
            outline: '1px solid rgba(0,0,0,0.2)',
          }}
        />
      </label>
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

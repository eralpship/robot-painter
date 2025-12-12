import { TextureEditorContext } from '@/contexts/texture-editor-context'
import { useNavigate } from '@tanstack/react-router'
import { debounce } from 'lodash'
import { useCallback, useContext, useEffect, useState } from 'react'
import { validateProjectName, sanitizeProjectName } from '@/utils/projectValidation'

export function CommonToolbar() {
  const ctx = useContext(TextureEditorContext)
  const navigate = useNavigate()
  const [localColor, setLocalColor] = useState(ctx.backgroundColor)
  const [isCreatingProject, setIsCreatingProject] = useState(false)

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
        onClick={() => {
          if (confirm('Reset to defaults? This will clear all elements and restore LEFT/RIGHT/FRONT/BACK/LID text.')) {
            ctx.resetToDefaults()
          }
        }}
        style={{
          cursor: 'pointer',
        }}
      >
        reset
      </button>
      <button
        onClick={async () => {
          if (isCreatingProject) return

          const name = window.prompt('Enter project name:')

          if (name === null) {
            // User cancelled
            return
          }

          const validation = validateProjectName(name)

          if (!validation.valid) {
            alert(validation.error)
            return
          }

          const sanitizedName = sanitizeProjectName(name)

          setIsCreatingProject(true)
          try {
            // Create project and get the new ID
            const newProjectId = await ctx.createNewProject(sanitizedName)

            // Navigate to the current route with the new project-id
            // Use full page reload to ensure context reinitializes with new projectId
            const currentPath = ctx.mode === 'full' ? '/texture-editor' : '/'

            // Force full page reload with new URL
            window.location.href = `${currentPath}?project-id=${newProjectId}`
          } catch (error) {
            console.error('[CommonToolbar] Failed to create new project:', error)
            setIsCreatingProject(false)
          }
        }}
        style={{
          cursor: 'pointer',
          opacity: isCreatingProject ? 0.5 : 1,
        }}
        disabled={isCreatingProject}
      >
        {isCreatingProject ? 'creating...' : 'new project'}
      </button>
    </>
  )
}

import { CommonToolbar } from './CommonToolbar'
import { AddElementToolbar } from './AddElementToolbar'
import { ElementToolbar } from './ElementToolbar'
import { TextToolbar } from './TextToolbar'
import { useContext } from 'react'
import { TextureEditorContext } from '@/contexts/texture-editor-context'

export function Toolbar() {
  const { mode, selectedElementId, elements } = useContext(TextureEditorContext)
  const selectedElementType = selectedElementId
    ? elements.get(selectedElementId)?.type
    : undefined
  return (
    <div
      style={{
        padding: '8px',
        backgroundColor: '#181c20',
        borderBottom: '1px solid #444',
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        width: '100%',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      <div
        style={{
          fontSize: '12px',
          color: 'rgb(180, 184, 188)',
          display: 'flex',
          flexWrap: 'wrap',
          flexDirection: 'row',
          alignItems: 'start',
          justifyContent: 'start',
          gap: '8px',
        }}
      >
        <CommonToolbar />
        {mode === 'full' ? (
          <>
            <AddElementToolbar />
            {selectedElementId ? <ElementToolbar /> : null}
            {selectedElementType === 'text' ? <TextToolbar /> : null}
          </>
        ) : null}
      </div>
    </div>
  )
}

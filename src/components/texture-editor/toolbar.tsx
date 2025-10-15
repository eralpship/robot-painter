import { CommonToolbar } from './CommonToolbar'
import { AddElementToolbar } from './AddElementToolbar'
import { ElementToolbar } from './ElementToolbar'
import { TextToolbar } from './TextToolbar'
import { useContext } from 'react'
import { TextureEditorContext } from '@/contexts/texture-editor-context'

export function Toolbar() {
  const ctx = useContext(TextureEditorContext)
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
        {ctx.mode === 'full' ? (
          <>
            <AddElementToolbar />
            {ctx.selectedElement ? <ElementToolbar /> : null}
            {ctx.selectedElement?.type === 'text' ? <TextToolbar /> : null}
          </>
        ) : null}
      </div>
    </div>
  )
}

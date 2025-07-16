import React, { useState } from 'react'
import { TextureEditor } from './TextureEditor'

interface TextureEditorWrapperProps {
  baseColor: string
}

export function TextureEditorWrapper({ baseColor }: TextureEditorWrapperProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null)

  return (
    <div style={{
      height: '100%',
      width: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Fixed Toolbar at top */}
      <div style={{
        flex: '0 0 auto',
        padding: '8px',
        backgroundColor: '#181c20',
        borderBottom: '1px solid #444',
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        width: '100%',
        boxSizing: 'border-box',
        position: 'relative',
        zIndex: 1000
      }}>
        <button
          onClick={() => {
            // This will be handled by TextureEditor component
            const event = new CustomEvent('editSelectedText', { detail: { selectedId } })
            document.dispatchEvent(event)
          }}
          disabled={!selectedId}
          style={{
            padding: '4px 8px',
            backgroundColor: selectedId ? '#0099ff' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: selectedId ? 'pointer' : 'not-allowed',
            fontSize: '12px'
          }}
        >
          Edit Text
        </button>
        <span style={{ fontSize: '12px', color: '#b4b8bc' }}>
          {selectedId ? 'Text selected' : 'Select text to edit'}
        </span>
      </div>
      
      {/* Flexible Canvas Area */}
      <div style={{
        flex: '1',
        minHeight: 0,
        position: 'relative',
        zIndex: 1
      }}>
        <TextureEditor 
          selectedId={selectedId}
          onSelectionChange={setSelectedId}
          baseColor={baseColor}
        />
      </div>
    </div>
  )
}
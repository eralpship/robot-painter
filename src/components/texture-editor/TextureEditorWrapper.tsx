import React, { useState } from 'react'
import { TextureEditor } from './TextureEditor'

export function TextureEditorWrapper() {
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
        backgroundColor: '#e0e0e0',
        borderBottom: '1px solid #ccc',
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        width: '100%',
        boxSizing: 'border-box'
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
        <span style={{ fontSize: '12px', color: '#666' }}>
          {selectedId ? 'Text selected' : 'Select text to edit'}
        </span>
      </div>
      
      {/* Flexible Canvas Area */}
      <div style={{
        flex: '1',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 0
      }}>
        <TextureEditor 
          selectedId={selectedId}
          onSelectionChange={setSelectedId}
        />
      </div>
    </div>
  )
}
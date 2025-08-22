import { TextureEditor, type TextureEditorRef } from './TextureEditor'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

interface ElementProperties {
  type: 'text'
  text: string
  fontSize: number
}

export type TextureEditorWrapperRef = {
  setBaseColor: (color: string) => void
}

export const TextureEditorWrapper = forwardRef<TextureEditorWrapperRef>(
  (_, ref) => {
    const textureEditorRef = useRef<TextureEditorRef>(null)
    const [selectedElement, setSelectedElement] = useState<{
      id: string
      properties: ElementProperties
    } | null>(null)

    useImperativeHandle(
      ref,
      () => ({
        setBaseColor: (color: string) => {
          textureEditorRef.current?.setBaseColor?.(color)
        },
      }),
      []
    )

    const handleSelectedElement = (svgElementId: string, properties: ElementProperties) => {
      setSelectedElement({ id: svgElementId, properties })
    }

    const handleChangeText = () => {
      if (!selectedElement) {
        alert('Please select a text element first')
        return
      }

      const newText = window.prompt('Enter new text:', selectedElement.properties.text)
      
      if (newText !== null && newText !== selectedElement.properties.text) {
        textureEditorRef.current?.updateElement(selectedElement.id, { text: newText })
        
        // Update local state
        setSelectedElement(prev => prev ? {
          ...prev,
          properties: { ...prev.properties, text: newText }
        } : null)
      }
    }

    const handleChangeFontSize = () => {
      if (!selectedElement) {
        alert('Please select a text element first')
        return
      }

      const currentFontSize = selectedElement.properties.fontSize.toString()
      const input = window.prompt('Enter font size (number only):', currentFontSize)
      
      if (input !== null) {
        const newFontSize = parseFloat(input)
        
        // Validate input - must be a positive number
        if (!isNaN(newFontSize) && newFontSize > 0) {
          textureEditorRef.current?.updateElement(selectedElement.id, { fontSize: newFontSize })
          
          // Update local state
          setSelectedElement(prev => prev ? {
            ...prev,
            properties: { ...prev.properties, fontSize: newFontSize }
          } : null)
        }
        // If invalid, fall back to previous value (do nothing)
      }
    }

    return (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'grid',
          gridTemplateRows: 'auto 1fr',
          gridTemplateColumns: '1fr',
        }}
      >
        {/* Fixed Toolbar at top */}
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
          <span style={{ fontSize: '12px', color: '#b4b8bc' }}>
            <button onClick={() => textureEditorRef.current?.updateTexture()}>
              redraw
            </button>
            <button 
              onClick={handleChangeText}
              disabled={!selectedElement}
              style={{
                marginLeft: '8px',
                opacity: selectedElement ? 1 : 0.5,
                cursor: selectedElement ? 'pointer' : 'not-allowed'
              }}
            >
              change text
            </button>
            <button 
              onClick={handleChangeFontSize}
              disabled={!selectedElement}
              style={{
                marginLeft: '8px',
                opacity: selectedElement ? 1 : 0.5,
                cursor: selectedElement ? 'pointer' : 'not-allowed'
              }}
            >
              font size
            </button>
          </span>
        </div>

        {/* Canvas Area */}
        <div
          style={{
            minHeight: 0,
            containerType: 'size',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <TextureEditor
            ref={textureEditorRef}
            onSelectedElement={handleSelectedElement}
            style={{
              width: 'min(100cqw, 100cqh)',
              height: 'min(100cqw, 100cqh)',
              aspectRatio: '1',
            }}
          />
        </div>
      </div>
    )
  }
)

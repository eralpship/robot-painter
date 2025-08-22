import { TextureEditor, type TextureEditorRef } from './TextureEditor'
import { AddElementToolbar } from './AddElementToolbar'
import { ElementToolbar } from './ElementToolbar'
import { TextToolbar } from './TextToolbar'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

interface ElementProperties {
  type: 'text'
  text: string
  fontSize: number
  rotation: number
  color: string
}

export type TextureEditorWrapperRef = {
  setBaseColor: (color: string) => void
}

export type TexureEditorWrapperProps = {
  mode: 'full' | 'basic'
}

export const TextureEditorWrapper = forwardRef<
  TextureEditorWrapperRef,
  TexureEditorWrapperProps
>(({ mode }, ref) => {
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

  const handleSelectedElement = (
    svgElementId: string,
    properties: ElementProperties
  ) => {
    setSelectedElement({ id: svgElementId, properties })
  }

  const handleRemoveElement = () => {
    if (!selectedElement) {
      alert('Please select a text element first')
      return
    }

    // Call the remove function
    textureEditorRef.current?.removeElement?.(selectedElement.id)

    // Clear local selection state
    setSelectedElement(null)
  }

  const handleChangeText = () => {
    if (!selectedElement) {
      alert('Please select a text element first')
      return
    }

    const newText = window.prompt(
      'Enter new text:',
      selectedElement.properties.text
    )

    if (newText !== null && newText !== selectedElement.properties.text) {
      textureEditorRef.current?.updateElement(selectedElement.id, {
        text: newText,
      })

      // Update local state
      setSelectedElement(prev =>
        prev
          ? {
              ...prev,
              properties: { ...prev.properties, text: newText },
            }
          : null
      )
    }
  }

  const handleChangeFontSize = () => {
    if (!selectedElement) {
      alert('Please select a text element first')
      return
    }

    const currentFontSize = selectedElement.properties.fontSize.toString()
    const input = window.prompt(
      'Enter font size (number only):',
      currentFontSize
    )

    if (input !== null) {
      const newFontSize = parseFloat(input)

      // Validate input - must be a positive number
      if (!isNaN(newFontSize) && newFontSize > 0) {
        textureEditorRef.current?.updateElement(selectedElement.id, {
          fontSize: newFontSize,
        })

        // Update local state
        setSelectedElement(prev =>
          prev
            ? {
                ...prev,
                properties: { ...prev.properties, fontSize: newFontSize },
              }
            : null
        )
      }
      // If invalid, fall back to previous value (do nothing)
    }
  }

  const handleChangeRotation = () => {
    if (!selectedElement) {
      alert('Please select a text element first')
      return
    }

    const currentRotation = selectedElement.properties.rotation.toString()
    const input = window.prompt(
      'Enter rotation in degrees (negative allowed):',
      currentRotation
    )

    if (input !== null) {
      const newRotation = parseFloat(input)

      // Validate input - must be a number (positive or negative)
      if (!isNaN(newRotation)) {
        textureEditorRef.current?.updateElement(selectedElement.id, {
          rotation: newRotation,
        })

        // Update local state
        setSelectedElement(prev =>
          prev
            ? {
                ...prev,
                properties: { ...prev.properties, rotation: newRotation },
              }
            : null
        )
      }
      // If invalid, fall back to previous value (do nothing)
    }
  }

  const handleChangeColor = () => {
    if (!selectedElement) {
      alert('Please select a text element first')
      return
    }

    const currentColor = selectedElement.properties.color
    const input = window.prompt(
      'Enter hex color (e.g., #ff0000, #000000):',
      currentColor
    )

    if (input !== null) {
      // Validate hex color format
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/

      if (hexColorRegex.test(input)) {
        textureEditorRef.current?.updateElement(selectedElement.id, {
          color: input,
        })

        // Update local state
        setSelectedElement(prev =>
          prev
            ? {
                ...prev,
                properties: { ...prev.properties, color: input },
              }
            : null
        )
      }
      // If invalid format, fall back to previous value (do nothing)
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
          {mode === 'full' ? (
            <>
              <AddElementToolbar
                onAddText={() => textureEditorRef.current?.addText?.()}
              />
              {selectedElement && (
                <ElementToolbar
                  onRotation={handleChangeRotation}
                  onRemove={handleRemoveElement}
                />
              )}
              {selectedElement &&
                selectedElement.properties.type === 'text' && (
                  <TextToolbar
                    onChangeText={handleChangeText}
                    onChangeFontSize={handleChangeFontSize}
                    onChangeColor={handleChangeColor}
                  />
                )}
            </>
          ) : null}
        </div>
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
})

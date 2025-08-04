import { useRef } from 'react'
import { TextureEditor, type TextureEditorRef } from './TextureEditor'

interface TextureEditorWrapperProps {
  baseColor: string
}

export function TextureEditorWrapper({ baseColor }: TextureEditorWrapperProps) {
  const textureEditorRef = useRef<TextureEditorRef>(null)
  return (
    <div style={{
      height: '100%',
      width: '100%',
      display: 'grid',
      gridTemplateRows: 'auto 1fr',
      gridTemplateColumns: '1fr'
    }}>
      {/* Fixed Toolbar at top */}
      <div style={{
        padding: '8px',
        backgroundColor: '#181c20',
        borderBottom: '1px solid #444',
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        width: '100%',
        boxSizing: 'border-box',
        position: 'relative',
      }}>
        <span style={{ fontSize: '12px', color: '#b4b8bc' }}>
          <button onClick={() => textureEditorRef.current?.updateTexture()}>redraw</button>
        </span>
      </div>
      
      {/* Canvas Area */}
      <div style={{
        minHeight: 0,
        containerType: 'size',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <TextureEditor 
          ref={textureEditorRef}
          baseColor={baseColor}
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
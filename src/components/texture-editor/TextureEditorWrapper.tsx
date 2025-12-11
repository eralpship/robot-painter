import { useContext } from 'react'
import { TextureEditor } from './TextureEditor'
import { Toolbar } from './toolbar'
import {
  TextureEditorContextProvider,
  TextureEditorContext,
  type TexureEditorMode,
} from '@/contexts/texture-editor-context'

const editorStyle = {
  width: 'min(100cqw, 100cqh)',
  height: 'min(100cqw, 100cqh)',
  aspectRatio: '1',
}

function BackdropWithDeselect({ children }: { children: React.ReactNode }) {
  const editorCtx = useContext(TextureEditorContext)

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only deselect if clicking directly on the backdrop (not its children like SVG)
    if (e.target === e.currentTarget) {
      console.log('[TextureEditorWrapper] Backdrop clicked, deselecting')
      editorCtx.setSelectedElementId(undefined)
    }
  }

  return (
    <div
      id="texture-editor-wrapper-backdrop"
      onMouseDown={handleBackdropClick}
      style={{
        minHeight: 0,
        containerType: 'size',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // Checkered transparency pattern
        backgroundColor: '#2a2a2a',
        backgroundImage: `
          linear-gradient(45deg, #3a3a3a 25%, transparent 25%),
          linear-gradient(-45deg, #3a3a3a 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #3a3a3a 75%),
          linear-gradient(-45deg, transparent 75%, #3a3a3a 75%)
        `,
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
      }}
    >
      {children}
    </div>
  )
}

export function TextureEditorWrapper({ mode }: { mode: TexureEditorMode }) {
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
      <TextureEditorContextProvider mode={mode}>
        <Toolbar />
        <BackdropWithDeselect>
          <TextureEditor side="front" style={editorStyle} />
          <TextureEditor side="back" style={editorStyle} />
          <TextureEditor side="left" style={editorStyle} />
          <TextureEditor side="right" style={editorStyle} />
          <TextureEditor side="lid" style={editorStyle} />
        </BackdropWithDeselect>
      </TextureEditorContextProvider>
    </div>
  )
}

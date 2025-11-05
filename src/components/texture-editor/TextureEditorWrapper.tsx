import { TextureEditor } from './TextureEditor'
import { Toolbar } from './toolbar'
import {
  TextureEditorContextProvider,
  type TexureEditorMode,
} from '@/contexts/texture-editor-context'

const editorStyle = {
  width: 'min(100cqw, 100cqh)',
  height: 'min(100cqw, 100cqh)',
  aspectRatio: '1',
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
        <div
          style={{
            minHeight: 0,
            containerType: 'size',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <TextureEditor side="front" style={editorStyle} />
          <TextureEditor side="back" style={editorStyle} />
          <TextureEditor side="left" style={editorStyle} />
          <TextureEditor side="right" style={editorStyle} />
          <TextureEditor side="lid" style={editorStyle} />
        </div>
      </TextureEditorContextProvider>
    </div>
  )
}

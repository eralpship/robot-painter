import { TextureEditor } from './TextureEditor'
import { Toolbar } from './toolbar'
import {
  TextureEditorContextProvider,
  type TexureEditorMode,
} from '@/contexts/texture-editor-context'

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
          <TextureEditor
            style={{
              width: 'min(100cqw, 100cqh)',
              height: 'min(100cqw, 100cqh)',
              aspectRatio: '1',
            }}
          />
        </div>
      </TextureEditorContextProvider>
    </div>
  )
}

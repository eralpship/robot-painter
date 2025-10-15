import { TextureEditor, type TextureEditorRef } from './TextureEditor'
import { forwardRef, useImperativeHandle, useRef } from 'react'
import { Toolbar } from './toolbar'
import { TextureEditorContextProvider } from '@/contexts/texture-editor-context'

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

  useImperativeHandle(
    ref,
    () => ({
      setBaseColor: (color: string) => {
        textureEditorRef.current?.setBaseColor?.(color)
      },
    }),
    []
  )

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
            ref={textureEditorRef}
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
})

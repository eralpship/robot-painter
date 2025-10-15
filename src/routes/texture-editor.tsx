import { createFileRoute } from '@tanstack/react-router'
import { TextureEditorWrapper } from '../components/texture-editor/TextureEditorWrapper'
import type { TextureEditorWrapperRef } from '../components/texture-editor/TextureEditorWrapper'
import { OverlayTextureCanvasProvider } from '../contexts/overlay-texture-canvas-context'
import { FloatingCollapsibleWindow } from '../components/FloatingCollapsibleWindow'
import { RobotPreview, type RobotPreviewRef } from '../components/RobotPreview'
import { Leva, useControls } from 'leva'
import { useRef } from 'react'

export const Route = createFileRoute('/texture-editor')({
  component: TextureEditor,
})

const customLevaTheme = {
  sizes: {
    rootWidth: '340px',
  },
}

function TextureEditor() {
  const initialBaseColor = '#ffffff'

  const robotPreviewRef = useRef<RobotPreviewRef | null>(null)
  const textureEditorRef = useRef<TextureEditorWrapperRef | null>(null)
  useControls(() => ({
    baseColor: {
      value: initialBaseColor,
      label: 'Base Color',
      onChange: color => {
        textureEditorRef.current?.setBackgroundColor(color)
        robotPreviewRef.current?.setBaseColor(color)
      },
    },
  }))

  return (
    <OverlayTextureCanvasProvider>
      <div style={{ height: '100vh', width: '100vw' }}>
        <Leva
          theme={customLevaTheme}
          collapsed={false}
          titleBar={{ title: 'Preview Controls', filter: false }}
        />
        <TextureEditorWrapper mode="full" ref={textureEditorRef} />
        <FloatingCollapsibleWindow title="preview" x={10} y={40}>
          <RobotPreview ref={robotPreviewRef} />
        </FloatingCollapsibleWindow>
      </div>
    </OverlayTextureCanvasProvider>
  )
}

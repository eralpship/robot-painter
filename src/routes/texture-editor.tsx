import { createFileRoute } from '@tanstack/react-router'
import { TextureEditorWrapper } from '../components/texture-editor/TextureEditorWrapper'
import { OverlayTextureCanvasProvider } from '../contexts/overlay-texture-canvas-context'
import { FloatingCollapsibleWindow } from '../components/FloatingCollapsibleWindow'
import { RobotPreview } from '../components/RobotPreview'
import { Leva, useControls } from 'leva'

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

  const [{ baseColor }] = useControls(() => ({
    baseColor: {
      value: initialBaseColor,
      label: 'Base Color',
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
        <TextureEditorWrapper />
        <FloatingCollapsibleWindow title="preview" x={10} y={50}>
          <RobotPreview baseColor={baseColor} />
        </FloatingCollapsibleWindow>
      </div>
    </OverlayTextureCanvasProvider>
  )
}

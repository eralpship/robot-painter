import { createFileRoute } from '@tanstack/react-router'
import { TextureEditorWrapper } from '../components/texture-editor/TextureEditorWrapper'
import { OverlayTextureCanvasProvider } from '../contexts/overlay-texture-canvas-context'
import { FloatingCollapsibleWindow } from '../components/FloatingCollapsibleWindow'
import { RobotPreview } from '../components/RobotPreview'

export const Route = createFileRoute('/texture-editor')({
  component: TextureEditor,
})

function TextureEditor() {
  return (
    <OverlayTextureCanvasProvider>
      <div style={{ height: '100vh', width: '100vw' }}>
        <TextureEditorWrapper mode="full" />
        <FloatingCollapsibleWindow
          title="preview"
          x={12}
          y={48}
          width={300}
          height={260}
        >
          <RobotPreview />
        </FloatingCollapsibleWindow>
      </div>
    </OverlayTextureCanvasProvider>
  )
}

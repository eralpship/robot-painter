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
        <TextureEditorWrapper baseColor={'white'} />
        <FloatingCollapsibleWindow title="preview">
          <RobotPreview baseColor="white" />
        </FloatingCollapsibleWindow>
      </div>
    </OverlayTextureCanvasProvider>
  )
}
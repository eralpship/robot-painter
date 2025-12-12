import { createFileRoute } from '@tanstack/react-router'
import { TextureEditorWrapper } from '../components/texture-editor/TextureEditorWrapper'
import { OverlayTextureCanvasProvider } from '../contexts/overlay-texture-canvas-context'
import { FloatingCollapsibleWindow } from '../components/FloatingCollapsibleWindow'
import { RobotPreview } from '../components/RobotPreview'

type SearchParams = {
  'project-id'?: number
}

export const Route = createFileRoute('/texture-editor')({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    return {
      'project-id': search['project-id'] ? Number(search['project-id']) : undefined,
    }
  },
  component: TextureEditor,
})

function TextureEditor() {
  const search = Route.useSearch()
  const projectId = search['project-id']

  return (
    <OverlayTextureCanvasProvider>
      <div style={{ height: '100vh', width: '100vw' }}>
        <TextureEditorWrapper mode="full" projectId={projectId} />
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

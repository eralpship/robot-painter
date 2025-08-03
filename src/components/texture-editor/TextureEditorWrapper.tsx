import { TextureEditor } from './TextureEditor'

interface TextureEditorWrapperProps {
  baseColor: string
}

export function TextureEditorWrapper({ baseColor }: TextureEditorWrapperProps) {
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
          Toolbar WIP
        </span>
      </div>
      
      {/* Canvas Area */}
      <div style={{
        minHeight: 0,
        padding: 'calc(max(0px, (100% - 100cqh) / 2)) calc(max(0px, (100% - 100cqw) / 2))',
        containerType: 'size',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <TextureEditor 
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
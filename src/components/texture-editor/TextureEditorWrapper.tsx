import { TextureEditor } from './TextureEditor'

interface TextureEditorWrapperProps {
  baseColor: string
}

export function TextureEditorWrapper({ baseColor }: TextureEditorWrapperProps) {
  return (
    <div style={{
      height: '100%',
      width: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Fixed Toolbar at top */}
      <div style={{
        flex: '0 0 auto',
        padding: '8px',
        backgroundColor: '#181c20',
        borderBottom: '1px solid #444',
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        width: '100%',
        boxSizing: 'border-box',
        position: 'relative',
        zIndex: 1000
      }}>
        <span style={{ fontSize: '12px', color: '#b4b8bc' }}>
          Toolbar WIP
        </span>
      </div>
      
      {/* Flexible Canvas Area */}
      <div style={{
        flex: '1',
        minHeight: 0,
        position: 'relative',
        zIndex: 1,
        backgroundColor: 'blue',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <TextureEditor 
          baseColor={baseColor}
        />
      </div>
    </div>
  )
}
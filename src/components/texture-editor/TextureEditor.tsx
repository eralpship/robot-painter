import { useRef, useContext, useState, useCallback, useEffect } from 'react'
import { Stage, Layer } from 'react-konva'
import { CANVAS_SIZE } from './utils/konvaHelpers'
import { OverlayTextureContext } from '../../contexts/overlay-texture-canvas-context'
import { EditableText } from './EditableText'

interface TextElement {
  id: number
  text: string
  x: number
  y: number
  fontSize: number
  fill: string
  rotation: number
  scaleX: number
  scaleY: number
}

interface TextureEditorProps {
  selectedId: number | null
  onSelectionChange: (id: number | null) => void
  baseColor: string
}

export function TextureEditor({ selectedId, onSelectionChange, baseColor }: TextureEditorProps) {
  const stageRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const overlayTextureContext = useContext(OverlayTextureContext)
  const [stageSize, setStageSize] = useState({ width: 512, height: 512 })

  const overlayTexture = useContext(OverlayTextureContext)

  useEffect(() => {
    const interval = setInterval(() => {
      const konvaCanvas = stageRef.current.toCanvas();

      overlayTexture?.context.clearRect(0, 0, overlayTexture.canvas.width, overlayTexture.canvas.height);
      overlayTexture?.context.drawImage(konvaCanvas, 0, 0, overlayTexture.canvas.width, overlayTexture.canvas.height);
      overlayTexture?.triggerTextureUpdate();

    }, 33); // ~30fps

    return () => clearInterval(interval);
  }, []);
  
  // Initial text element - positioned in canvas coordinates (4096x4096)
  const [textElements, setTextElements] = useState<TextElement[]>([{
    id: 1,
    text: "Sample Text",
    x: 1500, // Position where it will be visible on robot front
    y: 1800, // Position where it will be visible on robot front
    fontSize: 200,
    fill: '#000000',
    rotation: 0,
    scaleX: 1,
    scaleY: 1
  }])
  
  if (!overlayTextureContext) {
    console.error('TextureEditor must be used within OverlayTextureCanvasProvider')
    return <div>Error: No overlay texture context found</div>
  }
  
  // Edit selected text - listen for custom event from wrapper
  useEffect(() => {
    const handleEditSelectedText = () => {
      const selectedElement = textElements.find(el => el.id === selectedId)
      if (selectedElement) {
        const newText = prompt('Edit text:', selectedElement.text)
        if (newText !== null) {
          setTextElements(prev => 
            prev.map(el => 
              el.id === selectedId 
                ? { ...el, text: newText }
                : el
            )
          )
        }
      }
    }

    document.addEventListener('editSelectedText', handleEditSelectedText)
    return () => document.removeEventListener('editSelectedText', handleEditSelectedText)
  }, [selectedId, textElements])

  // Calculate stage size based on container size
  useEffect(() => {
    const calculateSize = () => {
      if (!containerRef.current) return
      
      const container = containerRef.current
      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight
      
      // Calculate the maximum size that fits while maintaining aspect ratio
      const aspectRatio = 1 // Square canvas (4096x4096)
      
      const availableWidth = containerWidth
      const availableHeight = containerHeight
      
      let displayWidth = availableWidth
      let displayHeight = availableHeight
      
      // Maintain aspect ratio
      if (availableWidth / availableHeight > aspectRatio) {
        displayWidth = availableHeight * aspectRatio
      } else {
        displayHeight = availableWidth / aspectRatio
      }
      
      // Ensure minimum size
      const minSize = 200
      displayWidth = Math.max(minSize, displayWidth)
      displayHeight = Math.max(minSize, displayHeight)
      
      setStageSize({ width: displayWidth, height: displayHeight })
    }
    
    calculateSize()
    
    // Recalculate on window resize
    window.addEventListener('resize', calculateSize)
    
    // Use ResizeObserver if available for better container resize detection
    let resizeObserver: ResizeObserver | null = null
    if (window.ResizeObserver && containerRef.current) {
      resizeObserver = new ResizeObserver(calculateSize)
      resizeObserver.observe(containerRef.current)
    }
    
    return () => {
      window.removeEventListener('resize', calculateSize)
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
    }
  }, [])

  return (
    <div 
      ref={containerRef}
      style={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center' 
      }}
    >
      <div
        style={{
          width: stageSize.width,
          height: stageSize.height,
          position: 'relative'
        }}
      >
        {/* Background stencil image */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: baseColor,
            backgroundImage: 'url(/overlay_stencil.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            zIndex: 1,
            pointerEvents: 'none'
          }}
        />
        {/* Konva canvas on top */}
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          scaleX={stageSize.width / CANVAS_SIZE}
          scaleY={stageSize.height / CANVAS_SIZE}
          listening={true}
          style={{ position: 'relative', zIndex: 2 }}
          onMouseDown={(e) => {
            // Check if clicked on empty area
            if (e.target === e.target.getStage()) {
              onSelectionChange(null)
            }
          }}
        >
          <Layer>
          {textElements.map((textElement) => (
            <EditableText
              onTransform={function (attrs): void {
                throw new Error('Function not implemented.')
              } } key={textElement.id}
              {...textElement}
              isSelected={selectedId === textElement.id}
              onSelect={() => onSelectionChange(textElement.id)}
              onTextChange={(newText) => {
                setTextElements(prev => prev.map(el => el.id === textElement.id
                  ? { ...el, text: newText }
                  : el
                )
                )
              } }            />
          ))}
          </Layer>
        </Stage>
      </div>
    </div>
  )
}
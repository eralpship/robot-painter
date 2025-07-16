import { useRef, useContext, useState, useCallback, useEffect } from 'react'
import { Stage, Layer, Rect } from 'react-konva'
import { DISPLAY_SIZE, CANVAS_SIZE } from './utils/konvaHelpers'
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

export function TextureEditor() {
  const stageRef = useRef<any>(null)
  const overlayTextureContext = useContext(OverlayTextureContext)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  
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
  
  const { context: overlayContext, triggerTextureUpdate } = overlayTextureContext
  
  // Draw directly on shared canvas context
  const drawToSharedCanvas = useCallback(() => {
    if (!overlayContext) return
    
    // Clear the canvas
    overlayContext.clearRect(0, 0, 4096, 4096)
    
    // Draw white background
    overlayContext.fillStyle = '#ffffff'
    overlayContext.fillRect(0, 0, 4096, 4096)
    
    // Draw all text elements
    textElements.forEach(textElement => {
      overlayContext.save()
      
      // Set text properties
      overlayContext.font = `${textElement.fontSize}px Arial`
      overlayContext.fillStyle = textElement.fill
      overlayContext.textAlign = 'left'
      overlayContext.textBaseline = 'top'
      
      // Apply transformations
      overlayContext.translate(textElement.x, textElement.y)
      overlayContext.rotate(textElement.rotation)
      overlayContext.scale(textElement.scaleX, textElement.scaleY)
      
      // Draw the text
      overlayContext.fillText(textElement.text, 0, 0)
      
      overlayContext.restore()
    })
    
    // Trigger texture update
    triggerTextureUpdate()
  }, [overlayContext, textElements, triggerTextureUpdate])

  // Debounced draw to avoid excessive updates  
  const debouncedDraw = useCallback(() => {
    const timeoutId = setTimeout(() => {
      try {
        drawToSharedCanvas()
      } catch (error) {
        console.error('Error during canvas draw:', error)
      }
    }, 500) // Increased to 500ms as requested
    return () => clearTimeout(timeoutId)
  }, [drawToSharedCanvas])
  
  // Trigger draw on text changes
  useEffect(() => {
    const cleanup = debouncedDraw()
    return cleanup
  }, [textElements, debouncedDraw])
  
  // Initial draw when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        drawToSharedCanvas()
      } catch (error) {
        console.error('Error during initial draw:', error)
      }
    }, 100) // Small delay to ensure context is ready
    
    return () => clearTimeout(timer)
  }, [drawToSharedCanvas])
  
  // Add keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedId) {
        setTextElements(prev => prev.filter(el => el.id !== selectedId))
        setSelectedId(null)
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedId])
  
  return (
    <div style={{ border: '1px solid #ccc', display: 'inline-block', backgroundColor: '#f0f0f0' }}>
      <Stage
        ref={stageRef}
        width={DISPLAY_SIZE}
        height={DISPLAY_SIZE}
        scaleX={DISPLAY_SIZE / CANVAS_SIZE}
        scaleY={DISPLAY_SIZE / CANVAS_SIZE}
        listening={true}
        onMouseDown={(e) => {
          // Check if clicked on empty area
          if (e.target === e.target.getStage()) {
            setSelectedId(null)
          }
        }}
      >
        <Layer>
          <Rect
            x={0}
            y={0}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            fill="#ffffff"
            listening={false}
          />
          {textElements.map((textElement) => (
            <EditableText
              key={textElement.id}
              {...textElement}
              isSelected={selectedId === textElement.id}
              onSelect={() => setSelectedId(textElement.id)}
              onTransform={(attrs) => {
                setTextElements(prev => 
                  prev.map(el => 
                    el.id === textElement.id 
                      ? { ...el, ...attrs }
                      : el
                  )
                )
                // Immediate draw on transform for real-time feedback
                try {
                  drawToSharedCanvas()
                } catch (error) {
                  console.error('Error during transform draw:', error)
                }
              }}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  )
}
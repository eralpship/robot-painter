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
}

export function TextureEditor({ selectedId, onSelectionChange }: TextureEditorProps) {
  const stageRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const overlayTextureContext = useContext(OverlayTextureContext)
  const [stageSize, setStageSize] = useState({ width: 512, height: 512 })
  
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

  // Draw directly on shared canvas context (NO stencil - only text)
  const drawToSharedCanvas = useCallback(() => {
    if (!overlayContext) return
    
    // Clear the canvas to transparent
    overlayContext.clearRect(0, 0, 4096, 4096)
    
    // No background - keep transparent
    
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
        onSelectionChange(null)
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedId, onSelectionChange])
  
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
            backgroundImage: 'url(/overlay_stencil.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.1,
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
              key={textElement.id}
              {...textElement}
              isSelected={selectedId === textElement.id}
              onSelect={() => onSelectionChange(textElement.id)}
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
              onTextChange={(newText) => {
                setTextElements(prev => 
                  prev.map(el => 
                    el.id === textElement.id 
                      ? { ...el, text: newText }
                      : el
                  )
                )
              }}
            />
          ))}
          </Layer>
        </Stage>
      </div>
    </div>
  )
}
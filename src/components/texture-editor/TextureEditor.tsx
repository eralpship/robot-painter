import { useRef, useContext, useState, useCallback, useEffect } from 'react'
import { Stage, Layer, Text } from 'react-konva'
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
  const displayStageRef = useRef<any>(null)
  const exportStageRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const overlayTextureContext = useContext(OverlayTextureContext)
  const [stageSize, setStageSize] = useState({ width: 512, height: 512 })
  const [stageReady, setStageReady] = useState(false)

  const overlayTexture = useContext(OverlayTextureContext)

  // Convert coordinates from display stage to export stage
  const convertToExportCoords = useCallback((displayCoords: any) => {
    const scaleFactor = CANVAS_SIZE / stageSize.width
    return {
      ...displayCoords,
      x: displayCoords.x * scaleFactor,
      y: displayCoords.y * scaleFactor,
      fontSize: displayCoords.fontSize * scaleFactor
    }
  }, [stageSize.width])

  // Sync canvas function using hidden export stage
  const syncToOverlayCanvas = useCallback(() => {
    if (!exportStageRef.current || !overlayTexture || !stageReady) {
      console.log('Sync skipped:', { exportStage: !!exportStageRef.current, texture: !!overlayTexture, ready: stageReady })
      return
    }
    
    try {
      const exportStage = exportStageRef.current
      console.log('Syncing canvas, export stage size:', exportStage.width(), 'x', exportStage.height())
      
      // Export from the hidden 4096x4096 stage
      const konvaCanvas = exportStage.toCanvas()
      console.log('Konva canvas created:', konvaCanvas.width, 'x', konvaCanvas.height)
      
      // Update overlay texture - direct 1:1 copy since both are CANVAS_SIZE x CANVAS_SIZE
      overlayTexture.context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
      overlayTexture.context.drawImage(konvaCanvas, 0, 0)
      overlayTexture.triggerTextureUpdate()
      console.log('Canvas synced successfully')
    } catch (error) {
      console.error('Failed to sync canvas:', error)
    }
  }, [overlayTexture, stageReady])

  // Initial sync when stage is ready
  useEffect(() => {
    if (stageReady) {
      // Force initial sync after stage is ready
      setTimeout(() => {
        console.log('Stage ready, triggering initial sync')
        setNeedsSync(true)
      }, 100)
    }
  }, [stageReady])

  // Event-based sync using requestAnimationFrame for smooth updates
  const [needsSync, setNeedsSync] = useState(false)
  
  useEffect(() => {
    if (!needsSync || !stageReady) return
    
    const frameId = requestAnimationFrame(() => {
      syncToOverlayCanvas()
      setNeedsSync(false)
    })
    
    return () => cancelAnimationFrame(frameId)
  }, [needsSync, stageReady, syncToOverlayCanvas])
  
  // Initial text element - positioned for display stage coordinates
  const [textElements, setTextElements] = useState<TextElement[]>([{
    id: 1,
    text: "Sample Text",
    x: 50, // Display coordinates
    y: 100, // Display coordinates
    fontSize: 40, // Display font size
    fill: '#ff0000', // Red for debugging
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

  // Mark stage as ready when both stages are available
  useEffect(() => {
    if (displayStageRef.current && exportStageRef.current && stageSize.width > 0 && stageSize.height > 0 && !stageReady) {
      setTimeout(() => {
        console.log('Setting stages ready, stage size:', stageSize)
        console.log('Display stage ref:', displayStageRef.current)
        console.log('Export stage ref:', exportStageRef.current)
        console.log('Text elements:', textElements)
        setStageReady(true)
        
        // Force stage redraw
        if (displayStageRef.current) {
          displayStageRef.current.batchDraw()
        }
        if (exportStageRef.current) {
          exportStageRef.current.batchDraw()
        }
      }, 50)
    }
  }, [stageSize, stageReady, textElements])

  // Trigger sync when text elements change
  useEffect(() => {
    if (stageReady) {
      setNeedsSync(true)
    }
  }, [textElements, stageReady])

  // Handle responsive scaling when stage size changes
  const [previousStageSize, setPreviousStageSize] = useState(stageSize)
  
  useEffect(() => {
    if (stageReady && previousStageSize.width > 0 && stageSize.width !== previousStageSize.width) {
      // Calculate scale factor based on width change
      const scaleFactor = stageSize.width / previousStageSize.width
      
      // Update text elements with new scaled positions and sizes
      setTextElements(prev => prev.map(element => ({
        ...element,
        x: element.x * scaleFactor,
        y: element.y * scaleFactor,
        fontSize: element.fontSize * scaleFactor
      })))
      
      setPreviousStageSize(stageSize)
    } else if (stageSize.width > 0) {
      setPreviousStageSize(stageSize)
    }
  }, [stageSize, previousStageSize, stageReady])

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
        {/* Display Stage - visible for UI interaction */}
        <Stage
          ref={displayStageRef}
          width={stageSize.width}
          height={stageSize.height}
          listening={true}
          style={{ 
            position: 'relative', 
            zIndex: 2
          }}
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
                  setNeedsSync(true)
                }}
                onTextChange={(newText) => {
                  setTextElements(prev => prev.map(el => el.id === textElement.id
                    ? { ...el, text: newText }
                    : el
                  )
                  )
                  setNeedsSync(true)
                }}
              />
            ))}
          </Layer>
        </Stage>
        
        {/* Hidden Export Stage - 4096x4096 for texture export */}
        <Stage
          ref={exportStageRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          listening={false}
          style={{ 
            position: 'absolute',
            left: '-9999px', // Hidden off-screen
            top: '0'
          }}
        >
          <Layer>
            {/* Export elements with scaled coordinates */}
            {textElements.map((textElement) => {
              const exportCoords = convertToExportCoords(textElement)
              return (
                <Text
                  key={`export-${textElement.id}`}
                  text={textElement.text}
                  x={exportCoords.x}
                  y={exportCoords.y}
                  fontSize={exportCoords.fontSize}
                  fill={textElement.fill}
                  rotation={textElement.rotation}
                  scaleX={textElement.scaleX}
                  scaleY={textElement.scaleY}
                />
              )
            })}
          </Layer>
        </Stage>
      </div>
    </div>
  )
}
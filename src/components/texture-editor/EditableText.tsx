import { useRef, useEffect, useState } from 'react'
import { Text, Transformer } from 'react-konva'

interface EditableTextProps {
  id: number
  text: string
  x: number
  y: number
  fontSize: number
  fill: string
  rotation: number
  scaleX: number
  scaleY: number
  isSelected: boolean
  onSelect: () => void
  onTransform: (attrs: Partial<EditableTextProps>) => void
  onTextChange: (newText: string) => void
}

export function EditableText({
  text,
  x,
  y,
  fontSize,
  fill,
  rotation,
  scaleX,
  scaleY,
  isSelected,
  onSelect,
  onTransform,
  onTextChange
}: EditableTextProps) {
  const textRef = useRef<any>(null)
  const trRef = useRef<any>(null)
  const [isDragging, setIsDragging] = useState(false)
  
  // Update editing text when props change
  useEffect(() => {
    // No longer needed for simple approach
  }, [text])
  
  // Handle double-click to start editing with alert
  const handleDoubleClick = (e: any) => {
    console.log('Double-click detected on text:', text, 'isDragging:', isDragging)
    e.cancelBubble = true
    if (e.stopPropagation) e.stopPropagation()
    
    // Only start editing if we're not dragging
    if (!isDragging) {
      const newText = prompt('Edit text:', text)
      if (newText !== null) {
        onTextChange(newText)
      }
    }
  }
  
  // Attach transformer when selected
  useEffect(() => {
    if (isSelected && textRef.current && trRef.current) {
      try {
        trRef.current.nodes([textRef.current])
        trRef.current.getLayer()?.batchDraw()
      } catch (error) {
        console.error('Error attaching transformer:', error)
      }
    } else if (trRef.current) {
      // Detach when not selected
      try {
        trRef.current.nodes([])
        trRef.current.getLayer()?.batchDraw()
      } catch (error) {
        console.error('Error detaching transformer:', error)
      }
    }
  }, [isSelected])

  // Cleanup transformer references on unmount
  useEffect(() => {
    return () => {
      try {
        if (trRef.current) {
          trRef.current.nodes([])
        }
      } catch (error) {
        console.error('Error cleaning up transformer:', error)
      }
    }
  }, [])
  
  return (
    <>
      <Text
        ref={textRef}
        text={text}
        x={x}
        y={y}
        fontSize={fontSize}
        fill={fill}
        rotation={rotation}
        scaleX={scaleX}
        scaleY={scaleY}
        draggable
        transformsEnabled="all"
        perfectDrawEnabled={false}
        listening={true}
        onClick={() => {
          console.log('Single click on text:', text)
          onSelect()
        }}
        onDblClick={handleDoubleClick}
        onDragStart={() => {
          console.log('Drag start')
          setIsDragging(true)
        }}
        onDragEnd={(e) => {
          console.log('Drag end')
          setIsDragging(false)
          onTransform({
            x: e.target.x(),
            y: e.target.y()
          })
        }}
        onTransformEnd={(e) => {
          const node = e.target
          onTransform({
            x: node.x(),
            y: node.y(),
            scaleX: node.scaleX(),
            scaleY: node.scaleY(),
            rotation: node.rotation()
          })
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          enabledAnchors={[
            'top-left',
            'top-right',
            'bottom-left',
            'bottom-right',
            'middle-left',
            'middle-right'
          ]}
          rotateEnabled={true}
          borderEnabled={true}
          borderStroke="#0099ff"
          borderStrokeWidth={2}
          anchorSize={8}
          anchorStroke="#0099ff"
          anchorFill="#ffffff"
          rotationSnaps={[0, 90, 180, 270]}
          boundBoxFunc={(oldBox, newBox) => {
            // Prevent negative scaling and set minimum size
            // Allow much smaller text - minimum 5px width/height
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox
            }
            return newBox
          }}
          onTransformEnd={() => {
            // Force a re-render after transformation
            if (trRef.current) {
              trRef.current.getLayer()?.batchDraw()
            }
          }}
        />
      )}
    </>
  )
}
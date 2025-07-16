# Texture Editor Implementation Plan

## Project Overview
Building a minimal texture editor that edits the overlay canvas. The existing system automatically applies canvas changes to the 3D model.

## Phase 1: Minimal Text Editor

### Scope
- ✅ Edit text directly on the overlay canvas (4096x4096)
- ✅ Move/scale/rotate text with Konva Transformer
- ✅ Predefined font and size (keep it simple)
- ✅ No separate UI - just functional text editing on canvas
- ✅ Leverage existing canvas-to-texture pipeline

### System Integration
- **OverlayTextureContext** provides the 4096x4096 canvas
- **TextureEditor** draws directly on this canvas using Konva
- **Existing system** automatically applies canvas as texture to 3D model
- **No base color editing** - only overlay layer editing

### Detailed Implementation Steps

#### Step 1: Install Konva Dependencies
**Task:** Install react-konva and konva with specific versions
```bash
npm install react-konva@^18.2.10 konva@^9.2.0 --save
```
**Success Criteria:**
- ✅ Dependencies installed successfully
- ✅ No version conflicts in package.json
- ✅ TypeScript types are available
- ✅ No console errors when importing Konva

#### Step 2: Create Basic Project Structure
**Task:** Set up the folder structure for texture editor components
```
/src/components/texture-editor/
├── TextureEditor.tsx
├── EditableText.tsx
├── hooks/
│   └── useCanvasSync.ts
└── utils/
    └── konvaHelpers.ts
```
**Success Criteria:**
- ✅ Folder structure created
- ✅ Empty TypeScript files created with basic exports
- ✅ No import/export errors
- ✅ Files are properly organized

#### Step 3: Create Basic TextureEditor Component
**Task:** Create a minimal Konva Stage wrapper component
**Success Criteria:**
- ✅ Component renders without errors
- ✅ Konva Stage displays with correct dimensions (512x512)
- ✅ Stage has proper scaling (512/4096 ratio)
- ✅ Basic event handling (onClick) works
- ✅ Component can be imported and used

#### Step 4: Connect to OverlayTextureContext
**Task:** Integrate TextureEditor with existing overlay canvas context
**Success Criteria:**
- ✅ OverlayTextureContext is properly imported
- ✅ Canvas reference is obtained from context
- ✅ No errors when context is undefined
- ✅ Canvas dimensions are correct (4096x4096)
- ✅ Context integration doesn't break existing functionality

#### Step 5: Add Single Hardcoded Text Element
**Task:** Add a static "Sample Text" element to the Konva Stage
**Success Criteria:**
- ✅ Text element appears on Stage
- ✅ Text is visible and properly positioned
- ✅ Text has correct styling (fontSize: 60, fill: black)
- ✅ Text scales correctly with Stage scaling
- ✅ No rendering errors or performance issues

#### Step 6: Implement EditableText Component
**Task:** Create a separate component for text elements with basic interactivity
**Success Criteria:**
- ✅ EditableText component renders text correctly
- ✅ Text is clickable and selectable
- ✅ Basic drag functionality works
- ✅ Component accepts props for text properties
- ✅ Event handlers (onClick, onDragEnd) function properly

#### Step 7: Add Konva Transformer
**Task:** Implement Transformer for text selection and manipulation
**Success Criteria:**
- ✅ Transformer appears when text is selected
- ✅ Transformer handles (anchors) are visible and functional
- ✅ Text can be resized using transformer handles
- ✅ Text can be rotated using transformer
- ✅ Transformer styling matches design (blue borders, white anchors)
- ✅ Minimum size constraints work correctly

#### Step 8: Implement Canvas Synchronization
**Task:** Sync Konva Stage content to overlay canvas in real-time
**Success Criteria:**
- ✅ Canvas sync function works without errors
- ✅ Konva content appears on overlay canvas
- ✅ Sync maintains proper resolution (4096x4096)
- ✅ Performance is acceptable (no lag during transforms)
- ✅ Debounced sync prevents excessive updates
- ✅ Error handling prevents crashes

#### Step 9: Add Keyboard Support
**Task:** Implement keyboard shortcuts for text manipulation
**Success Criteria:**
- ✅ Delete key removes selected text
- ✅ Keyboard events don't interfere with other app functionality
- ✅ Event listeners are properly cleaned up
- ✅ Keyboard shortcuts work only when appropriate
- ✅ No memory leaks from event listeners

#### Step 10: Performance Optimizations and Error Handling
**Task:** Implement Konva best practices for performance and stability
**Success Criteria:**
- ✅ `transformsEnabled="position"` applied where appropriate
- ✅ `perfectDrawEnabled={false}` for performance
- ✅ Proper cleanup in useEffect hooks
- ✅ Error boundaries or try-catch blocks for canvas operations
- ✅ Memory usage is reasonable
- ✅ No console errors during normal operation

#### Step 11: Integrate TextureEditor into Main Application
**Task:** Add TextureEditor component to the main application UI
**Success Criteria:**
- ✅ TextureEditor component is rendered in main app
- ✅ Component doesn't interfere with existing 3D model
- ✅ UI layout accommodates the texture editor
- ✅ Component is properly positioned and sized
- ✅ No conflicts with existing components

#### Step 12: Test Complete Integration
**Task:** Verify end-to-end functionality with 3D robot model
**Success Criteria:**
- ✅ Text changes appear on 3D robot model in real-time
- ✅ Overlay texture system works correctly
- ✅ No performance degradation in 3D rendering
- ✅ Text quality is acceptable on 3D model
- ✅ All transformations (move, scale, rotate) reflect on 3D model
- ✅ System is stable under normal use

### Technical Implementation

#### Component Structure
```
TextureEditor
└── Konva Stage (overlays the 4096x4096 canvas)
    └── Layer
        ├── Text (editable)
        └── Transformer (selection handles)
```

#### React-Konva Implementation Details

##### 1. Basic TextureEditor Component
```typescript
import React, { useRef, useState, useContext, useCallback } from 'react'
import { Stage, Layer, Text, Transformer } from 'react-konva'
import { OverlayTextureContext } from '../contexts/overlay-texture-canvas-context'

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
  const { canvas: overlayCanvas } = useContext(OverlayTextureContext)!
  const stageRef = useRef<any>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  
  // Add keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedId) {
        // Delete selected text
        setTextElements(prev => prev.filter(el => el.id !== selectedId))
        setSelectedId(null)
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedId])
  
  // Initial text element
  const [textElements, setTextElements] = useState<TextElement[]>([{
    id: 1,
    text: "Sample Text",
    x: 200,
    y: 200,
    fontSize: 60,
    fill: '#000000',
    rotation: 0,
    scaleX: 1,
    scaleY: 1
  }])
  
  // Sync Konva to overlay canvas - Direct drawing for better performance
  const syncToOverlayCanvas = useCallback(() => {
    try {
      const stage = stageRef.current
      if (!stage || !overlayCanvas) return
      
      const ctx = overlayCanvas.getContext('2d')!
      ctx.clearRect(0, 0, 4096, 4096)
      
      // Scale context to match full resolution
      ctx.save()
      ctx.scale(4096 / 512, 4096 / 512)
      
      // Draw stage content directly to context
      stage.getLayer().draw({ ctx })
      
      ctx.restore()
    } catch (error) {
      console.error('Failed to sync to overlay canvas:', error)
    }
  }, [overlayCanvas])
  
  return (
    <div style={{ border: '1px solid #ccc', display: 'inline-block' }}>
      <Stage
        ref={stageRef}
        width={512}
        height={512}
        scaleX={512 / 4096}
        scaleY={512 / 4096}
        listening={true}
        onMouseDown={(e) => {
          // Check if clicked on empty area
          if (e.target === e.target.getStage()) {
            setSelectedId(null)
          }
        }}
      >
        <Layer>
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
                syncToOverlayCanvas()
              }}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  )
}
```

##### 2. EditableText Component with Transformer
```typescript
interface EditableTextProps extends TextElement {
  isSelected: boolean
  onSelect: () => void
  onTransform: (attrs: Partial<TextElement>) => void
}

function EditableText({
  id,
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
  onTransform
}: EditableTextProps) {
  const textRef = useRef<any>(null)
  const trRef = useRef<any>(null)
  
  // Attach transformer when selected
  useEffect(() => {
    if (isSelected && textRef.current && trRef.current) {
      trRef.current.nodes([textRef.current])
      trRef.current.getLayer().batchDraw()
    }
  }, [isSelected])

  // Cleanup transformer references on unmount
  useEffect(() => {
    return () => {
      if (trRef.current) {
        trRef.current.nodes([])
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
        transformsEnabled="position"
        perfectDrawEnabled={false}
        onClick={onSelect}
        onDragEnd={(e) => {
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
          borderStrokeWidth={1}
          anchorSize={8}
          anchorStroke="#0099ff"
          anchorFill="#ffffff"
          boundBoxFunc={(oldBox, newBox) => {
            // Prevent negative scaling and set minimum size
            if (newBox.width < 20 || newBox.height < 20) {
              return oldBox
            }
            return newBox
          }}
        />
      )}
    </>
  )
}
```

##### 3. Canvas Synchronization Strategy
```typescript
// Debounced sync to avoid excessive updates
const debouncedSync = useCallback(
  debounce(() => {
    syncToOverlayCanvas()
  }, 100),
  [syncToOverlayCanvas]
)

// Trigger sync on any text change
useEffect(() => {
  debouncedSync()
}, [textElements, debouncedSync])
```

##### 4. Stage Scaling for UI with Retina Support
```typescript
// Scale down for UI display (512x512) but maintain full resolution (4096x4096)
const DISPLAY_SIZE = 512
const CANVAS_SIZE = 4096
const SCALE_FACTOR = DISPLAY_SIZE / CANVAS_SIZE

// Add retina display support
const pixelRatio = window.devicePixelRatio || 1

// In Stage props:
width={DISPLAY_SIZE * pixelRatio}
height={DISPLAY_SIZE * pixelRatio}
scaleX={SCALE_FACTOR}
scaleY={SCALE_FACTOR}
style={{
  width: DISPLAY_SIZE + 'px',
  height: DISPLAY_SIZE + 'px'
}}
```

#### Key Integration Points
- **OverlayTextureContext**: Provides the 4096x4096 canvas
- **Canvas sync**: Konva Stage → overlay canvas → 3D texture
- **Scaling**: Display at 512x512 but render at full 4096x4096 resolution
- **Transform handling**: Real-time updates with debounced canvas sync

#### React-Konva Key Concepts
1. **Stage**: Root container (like a canvas)
2. **Layer**: Groups elements for rendering
3. **Text**: Text elements with styling
4. **Transformer**: Provides selection handles and transform controls
5. **Events**: onClick, onDragEnd, onTransformEnd for interactivity

### Success Criteria
- Text appears on Konva stage
- Text can be moved/scaled/rotated with transformer
- Text changes appear on 3D robot model in real-time
- No additional UI needed - just functional editing

### File Changes Required
- Create `/src/components/texture-editor/TextureEditor.tsx`
- Create `/src/components/texture-editor/EditableText.tsx`
- Create `/src/components/texture-editor/hooks/useCanvasSync.ts`
- Create `/src/components/texture-editor/utils/konvaHelpers.ts`
- Update existing component to include TextureEditor (integration point TBD)

### Dependencies
```bash
npm install react-konva@^18.2.10 konva@^9.2.0 --save
```

## Performance Considerations
- Use `transformsEnabled="position"` for better performance when only position changes
- Use `perfectDrawEnabled={false}` for performance-critical scenarios
- Implement proper cleanup in useEffect hooks
- Use direct canvas drawing instead of toDataURL() for better performance
- Consider `listening={false}` on Stage if no events needed

## Memory Management
- Cleanup transformer references on unmount
- Properly handle node references
- Use debounced sync to avoid excessive updates

## Event Handling Enhancements
- Add keyboard support for delete key
- Implement proper event delegation
- Add error handling for canvas operations

## React Context Integration
Since React Context doesn't work directly in Stage children, consider wrapping Layer:
```typescript
<Stage>
  <OverlayTextureContext.Consumer>
    {(contextValue) => (
      <Layer>
        <YourTextComponent context={contextValue} />
      </Layer>
    )}
  </OverlayTextureContext.Consumer>
</Stage>
```

## Future Animation Support
For future enhancements, consider react-spring integration:
```typescript
import { Spring } from 'react-spring/konva'

<Spring
  from={{ opacity: 0, scaleX: 0.5, scaleY: 0.5 }}
  to={{ opacity: 1, scaleX: 1, scaleY: 1 }}
>
  {(props) => <Text {...props} />}
</Spring>
```

## Testing Strategy
- Unit tests for text manipulation functions
- Integration tests for canvas synchronization
- Performance benchmarks for large text count
- Visual regression tests

## Notes
- Keep it minimal - no complex UI or features
- Use existing overlay canvas system
- Focus on proving the integration works
- Single hardcoded text element to start
- Follow Konva best practices for performance
- Implement proper error handling and cleanup
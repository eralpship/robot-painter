# Texture Editor Implementation Plan

## Project Overview
Building a minimal texture editor for a 3D robot painting tool. The editor allows users to add and manipulate text on the robot's surface in real-time.

### System Architecture
- **3D Robot Model**: Main application displays a 3D robot model using Three.js
- **Overlay Texture System**: Uses a 4096x4096 canvas as texture applied to the robot
- **OverlayTextureContext**: React context providing shared canvas and update methods
- **TextureEditor**: New Konva-based component for editing text on the overlay canvas

### Key Technical Constraints
- Canvas resolution: 4096x4096 (CANVAS_SIZE constant)
- Framework: React with TypeScript
- 3D rendering: Three.js with @react-three/fiber
- Canvas library: Konva with react-konva
- Existing context: OverlayTextureContext provides `canvas`, `context`, and `triggerTextureUpdate()`

### Development Workflow for AI Agents
- **Testing Changes**: Use localhost:3000 to view the application
- **Visual Debugging**: Use Playwright MCP to take screenshots and analyze behavior
- **Development Server**: If not running, start with `npm run dev`
- **Documentation**: Use context7 MCP server to lookup Konva and react-konva best practices
- **Logs**: Check browser console via Playwright MCP for errors and debugging info

## 🏗️ CURRENT IMPLEMENTATION ARCHITECTURE

### Dual-Stage System (Key Innovation)
The texture editor uses a sophisticated dual-stage architecture that solved all scaling issues:

**Display Stage (User Interaction)**:
- Responsive size that fits the texture editor window
- Handles all user interactions (click, drag, transform)
- Uses display coordinates for UI elements
- Clean visual presentation without debug elements

**Export Stage (Texture Generation)**:
- Hidden off-screen 4096x4096 stage
- Uses CANVAS_SIZE coordinates for high-resolution export
- Generates texture data for the 3D robot model
- Automatically converts display coordinates to export coordinates

### Coordinate Conversion System
```typescript
const convertToExportCoords = useCallback((displayCoords: any) => {
  const scaleFactor = CANVAS_SIZE / stageSize.width
  return {
    ...displayCoords,
    x: displayCoords.x * scaleFactor,
    y: displayCoords.y * scaleFactor,
    fontSize: displayCoords.fontSize * scaleFactor
  }
}, [stageSize.width])
```

### Event-Based Synchronization
- Uses `requestAnimationFrame` for smooth updates
- Triggered by text element changes, not continuous intervals
- Syncs from hidden export stage to overlay canvas
- Direct 1:1 canvas copying (both 4096x4096)

### Responsive Scaling System
- Text elements automatically scale when window is resized
- Maintains proportional relationships
- Updates positions and font sizes dynamically
- Prevents distortion during window resizing

## ✅ IMPLEMENTATION COMPLETED SUCCESSFULLY

### Current Implementation Status
**Files implemented and working:**
- ✅ `/src/components/texture-editor/TextureEditor.tsx` (fully functional with dual-stage system)
- ✅ `/src/components/texture-editor/EditableText.tsx` (working with proper drag handling)
- ✅ `/src/components/texture-editor/utils/konvaHelpers.ts` (has CANVAS_SIZE constant)
- ✅ Dependencies: react-konva and konva are already installed

### ✅ ALL CRITICAL ISSUES FIXED
1. ✅ **Mouse Drag Sticking RESOLVED**: Text now stops following mouse after drag ends
   - **Solution**: Removed problematic `e.target.stopDrag()` call from onDragEnd handler
   
2. ✅ **onTransform Error RESOLVED**: Transform handlers now work without errors
   - **Solution**: Implemented proper transform handler with attribute mapping
   
3. ✅ **Initial Rendering RESOLVED**: Sample Text now visible immediately on page load
   - **Solution**: Implemented dual-stage system with proper coordinate scaling

### ✅ ADDITIONAL IMPROVEMENTS COMPLETED
4. ✅ **Clean Canvas Export**: Implemented transformer hiding during export
5. ✅ **Smaller Text Scaling**: Reduced minimum text size from 30x15 to 5x5 pixels
6. ✅ **Consistent 4096x4096 Canvas**: Uses CANVAS_SIZE constant throughout
7. ✅ **Dual-Stage Architecture**: Separate display and export stages for optimal scaling
8. ✅ **Responsive Scaling**: Elements scale properly when texture editor window is resized
9. ✅ **Clean UI**: Removed debug elements (orange border, blue rectangle)

### Testing and Debugging Workflow
1. **Start Development Server**: `npm run dev` (if not already running)
2. **Open Application**: Navigate to localhost:3000 using Playwright MCP
3. **Take Screenshots**: Use Playwright MCP to capture current state
4. **Check Console**: Use Playwright MCP to view browser console for errors
5. **Test Interactions**: Click, drag, and transform text elements
6. **Verify Changes**: Ensure text appears on both texture editor and 3D model
7. **Research Documentation**: Use context7 MCP for Konva/react-konva best practices

### Current Integration Point
**TextureEditor is already integrated** in the main application:
- **Location**: Rendered in a draggable window in the main UI
- **Context**: Already wrapped in OverlayTextureCanvasProvider
- **Access**: Available via texture editor window (left side of screen)
- **3D Model**: Changes should appear immediately on the robot model (right side)

### ✅ SUCCESS CRITERIA ACHIEVED - "DONE"
✅ **All 3 critical issues fixed**:
1. ✅ Text can be dragged and stops following mouse on release
2. ✅ Text can be resized and rotated using transformer handles without errors
3. ✅ "Sample Text" is visible immediately on page load

✅ **Functionality working**:
- ✅ Click text to select (blue transformer handles appear)
- ✅ Drag text to move position
- ✅ Use transformer handles to resize and rotate
- ✅ Text appears on both texture editor canvas AND 3D robot model
- ✅ No console errors during normal operation

✅ **Performance**:
- ✅ No lag during transformations
- ✅ Smooth real-time updates to 3D model
- ✅ Event-based sync (not continuous interval)

✅ **Additional Quality Improvements**:
- ✅ Responsive window resizing with proper element scaling
- ✅ Clean export without selection UI elements
- ✅ Minimum text size reduced for better flexibility
- ✅ Consistent canvas sizing throughout application

## Quick Start for AI Agents

### Immediate Actions (Do This First)
1. **Start dev server**: `npm run dev`
2. **Open app**: Navigate to localhost:3000 with Playwright MCP
3. **Take screenshot**: Document current state
4. **Check console**: Look for any errors
5. **Test current issues**: Try dragging text, using transformer handles
6. **Read current files**: 
   - `/src/components/texture-editor/TextureEditor.tsx` (focus on line 195)
   - `/src/components/texture-editor/EditableText.tsx` (drag handlers)

### ✅ COMPLETED - Fix Priority Order
1. ✅ **Fixed onTransform error** (implemented proper transform handler)
2. ✅ **Fixed mouse drag sticking** (removed problematic stopDrag call)  
3. ✅ **Fixed initial rendering** (dual-stage system with coordinate scaling)
4. ✅ **Optimized sync** (event-based with requestAnimationFrame)

## ✅ Phase 1: Minimal Text Editor - COMPLETED

### ✅ Scope Achieved
- ✅ Edit text directly on the overlay canvas (CANVAS_SIZE x CANVAS_SIZE)
- ✅ Move/scale/rotate text with Konva Transformer
- ✅ Predefined font and size (keep it simple)
- ✅ No separate UI - just functional text editing on canvas
- ✅ Leverage existing canvas-to-texture pipeline

### System Integration
- **OverlayTextureContext** provides the CANVAS_SIZE x CANVAS_SIZE canvas
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
- ✅ Konva Stage displays with correct dimensions (CANVAS_SIZE x CANVAS_SIZE)
- ✅ Stage uses CSS scaling to fit container
- ✅ Basic event handling (onClick) works
- ✅ Component can be imported and used

#### Step 4: Connect to OverlayTextureContext
**Task:** Integrate TextureEditor with existing overlay canvas context
**Success Criteria:**
- ✅ OverlayTextureContext is properly imported
- ✅ Canvas reference is obtained from context
- ✅ No errors when context is undefined
- ✅ Canvas dimensions are correct (CANVAS_SIZE x CANVAS_SIZE)
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
- ✅ Sync maintains proper resolution (CANVAS_SIZE x CANVAS_SIZE)
- ✅ Performance is acceptable (no lag during transforms)
- ✅ Event-based sync prevents excessive updates
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
import React, { useRef, useState, useContext, useCallback, useEffect } from 'react'
import { Stage, Layer, Text, Transformer } from 'react-konva'
import { OverlayTextureContext } from '../contexts/overlay-texture-canvas-context'
import { CANVAS_SIZE } from './utils/konvaHelpers'

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
  const overlayTexture = useContext(OverlayTextureContext)!
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
      if (!stage || !overlayTexture) return
      
      // Access canvas and context from OverlayTextureContext
      const canvas = overlayTexture.canvas
      const ctx = overlayTexture.context
      
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
      
      // Option 1: Simple canvas copy (both are CANVAS_SIZE x CANVAS_SIZE)
      const konvaCanvas = stage.toCanvas()
      ctx.drawImage(konvaCanvas, 0, 0)
      
      // Option 2: Direct layer canvas access (more efficient)
      // const layer = stage.getLayers()[0]
      // const nativeCanvas = layer.getNativeCanvasElement()
      // ctx.drawImage(nativeCanvas, 0, 0)
      
      // Trigger texture update on the 3D model
      overlayTexture.triggerTextureUpdate()
    } catch (error) {
      console.error('Failed to sync to overlay canvas:', error)
    }
  }, [overlayTexture])
  
  return (
    <div style={{ 
      border: '1px solid #ccc', 
      display: 'inline-block',
      width: '100%',
      height: '100%',
      overflow: 'hidden'
    }}>
      <Stage
        ref={stageRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain'
        }}
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

##### 4. Simplified Stage Scaling with CSS
```typescript
// Use native CANVAS_SIZE (4096x4096), scale with CSS
import { CANVAS_SIZE } from './utils/konvaHelpers'

// Stage component setup:
<div style={{
  width: '100%',
  height: '100%',
  overflow: 'hidden'
}}>
  <Stage
    width={CANVAS_SIZE}
    height={CANVAS_SIZE}
    style={{
      width: '100%',
      height: '100%',
      objectFit: 'contain'
    }}
  >
    <Layer>
      {/* Your content */}
    </Layer>
  </Stage>
</div>
```

#### Key Integration Points
- **OverlayTextureContext**: Provides the CANVAS_SIZE x CANVAS_SIZE canvas and context
- **Canvas sync**: Konva Stage (CANVAS_SIZE) → overlay canvas (CANVAS_SIZE) → 3D texture
- **Scaling**: Native CANVAS_SIZE canvas scaled to fit window with CSS
- **Transform handling**: Event-based sync with requestAnimationFrame
- **Mouse coordinates**: Automatically handled by Konva at native resolution

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
- **EDIT** `/src/components/texture-editor/TextureEditor.tsx` (fix bugs, don't recreate)
- **EDIT** `/src/components/texture-editor/EditableText.tsx` (fix drag handlers) 
- **EXISTS** `/src/components/texture-editor/utils/konvaHelpers.ts` (has CANVAS_SIZE constant)
- **NOT NEEDED** `/src/components/texture-editor/hooks/useCanvasSync.ts` (sync logic goes in main component)
- **ALREADY DONE** TextureEditor integration (already in main app)

### ✅ Implementation Notes (Followed Successfully)
- ✅ Did not recreate existing files from scratch - edited existing files
- ✅ Did not add new integration points - used existing TextureEditor integration
- ✅ Did not install new dependencies - used existing react-konva and konva
- ✅ Did not create unnecessary hooks or utilities - kept implementation simple
- ✅ Did not modify the main application structure

### Dependencies
✅ **Already installed**: react-konva@^18.2.10 and konva@^9.2.0
❌ **Do not reinstall** - dependencies are already in package.json

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

## Simplified Canvas Architecture

### Constants from konvaHelpers.ts
```typescript
// Available constants from ./utils/konvaHelpers
export const DISPLAY_SIZE = 512    // Legacy - not used in new approach
export const CANVAS_SIZE = 4096    // Native canvas resolution
export const SCALE_FACTOR = DISPLAY_SIZE / CANVAS_SIZE // Legacy - not used
```

### Benefits of Native CANVAS_SIZE with CSS Scaling

**Advantages:**
- No complex pixelRatio calculations needed
- Direct 1:1 canvas copying (both are CANVAS_SIZE x CANVAS_SIZE)
- Automatic mouse coordinate scaling handled by Konva
- CSS handles display scaling efficiently
- Simplified synchronization logic
- Better performance (no scaling during sync)

**Implementation:**
```typescript
// Konva Stage: CANVAS_SIZE x CANVAS_SIZE (native resolution)
// Overlay Canvas: CANVAS_SIZE x CANVAS_SIZE (shared texture)
// Display: CSS scaled to fit window

import { CANVAS_SIZE } from './utils/konvaHelpers'

<Stage width={CANVAS_SIZE} height={CANVAS_SIZE} style={{ width: '100%', height: '100%' }}>
```

### Correct OverlayTextureContext Usage
```typescript
// Access the context
const overlayTexture = useContext(OverlayTextureContext)

// Access canvas and context
overlayTexture?.canvas    // HTMLCanvasElement (CANVAS_SIZE x CANVAS_SIZE)
overlayTexture?.context   // CanvasRenderingContext2D
overlayTexture?.triggerTextureUpdate() // Method to update 3D texture
```

### Optimized Canvas Synchronization Approaches

#### Approach 1: Native 4096x4096 Canvas (Recommended - Simplified)
```typescript
const syncCanvas = useCallback(() => {
  if (!stageRef.current || !overlayTexture) return
  
  // Get native CANVAS_SIZE canvas from Konva (no pixelRatio needed)
  const konvaCanvas = stageRef.current.toCanvas()
  
  // Direct copy - both canvases are CANVAS_SIZE x CANVAS_SIZE
  overlayTexture.context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
  overlayTexture.context.drawImage(konvaCanvas, 0, 0)
  overlayTexture.triggerTextureUpdate()
}, [overlayTexture])
```

#### Approach 2: Direct Layer Canvas Access (Most Efficient)
```typescript
const syncCanvas = useCallback(() => {
  if (!stageRef.current || !overlayTexture) return
  
  const layer = stageRef.current.getLayers()[0]
  const nativeCanvas = layer.getNativeCanvasElement()
  
  // Direct canvas-to-canvas copy - both are CANVAS_SIZE x CANVAS_SIZE
  overlayTexture.context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
  overlayTexture.context.drawImage(nativeCanvas, 0, 0)
  overlayTexture.triggerTextureUpdate()
}, [overlayTexture])
```

#### Approach 3: Event-Based Sync (Performance Optimized)
```typescript
const [needsSync, setNeedsSync] = useState(false)

// Mark for sync on changes
const handleTransform = (id: number, attrs: any) => {
  setTextElements(prev => prev.map(el => 
    el.id === id ? { ...el, ...attrs } : el
  ))
  setNeedsSync(true)
}

// Sync using requestAnimationFrame
useEffect(() => {
  if (!needsSync || !stageRef.current || !overlayTexture) return
  
  const frameId = requestAnimationFrame(() => {
    // Simple canvas copy - no pixelRatio needed
    const konvaCanvas = stageRef.current.toCanvas()
    
    overlayTexture.context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    overlayTexture.context.drawImage(konvaCanvas, 0, 0)
    overlayTexture.triggerTextureUpdate()
    
    setNeedsSync(false)
  })
  
  return () => cancelAnimationFrame(frameId)
}, [needsSync, overlayTexture])
```

## Implementation Priority Order

### Priority 1: Fix Critical Issues (MUST DO FIRST)
1. **Fix onTransform Error**: Implement proper transform handler in TextureEditor
2. **Fix Mouse Drag Sticking**: Use `stopDrag()` method and proper event handling  
3. **Fix Initial Rendering**: Add stage ready state and force initial sync

### Priority 2: Implement Optimized Sync
4. **Event-Based Sync**: Replace continuous interval with event-based updates
5. **Performance Optimization**: Use direct canvas access methods

### Priority 3: Polish and Testing
6. **Error Handling**: Add proper try-catch blocks
7. **Cleanup**: Ensure proper useEffect cleanup
8. **Testing**: Verify all transformations work correctly

## MCP Tools Usage for AI Agents

### Playwright MCP Commands
```javascript
// Navigate to application
mcp__playwright__browser_navigate({ url: "http://localhost:3000" })

// Take screenshot to see current state
mcp__playwright__browser_take_screenshot({ filename: "current-state.png" })

// Check browser console for errors
mcp__playwright__browser_console_messages()

// Click on elements to test interactions
mcp__playwright__browser_click({ element: "Sample Text", ref: "..." })

// Take snapshot to see page structure
mcp__playwright__browser_snapshot()
```

### Context7 MCP for Documentation
```javascript
// Research Konva best practices
WebFetch({ 
  url: "https://konvajs.org/docs/react/index.html",
  prompt: "Extract best practices for canvas synchronization and performance"
})

// Look up specific Konva methods
WebFetch({ 
  url: "https://konvajs.org/api/Konva.Stage.html",
  prompt: "Find information about toCanvas method and canvas export"
})
```

### Development Workflow Integration
- Always test changes visually with Playwright MCP
- Use screenshots to document before/after states
- Check console logs for errors after each change
- Research official documentation before implementing solutions

## Notes
- Keep it minimal - no complex UI or features
- Use existing overlay canvas system
- Focus on proving the integration works
- Single hardcoded text element to start
- Follow Konva best practices for performance
- Implement proper error handling and cleanup
- Use event-based sync instead of continuous interval for better performance
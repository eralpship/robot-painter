# Texture Editor Implementation Plan - SVG + React-Moveable Migration

## Project Overview
Building a minimal texture editor for a 3D robot painting tool using **SVG + react-moveable** instead of Konva. The editor allows users to add and manipulate text on the robot's surface in real-time.

### System Architecture
- **3D Robot Model**: Main application displays a 3D robot model using Three.js
- **Overlay Texture System**: Uses a 4096x4096 canvas as texture applied to the robot
- **OverlayTextureContext**: React context providing shared canvas and update methods
- **TextureEditor**: NEW SVG-based component for editing text on the overlay canvas

### Key Technical Constraints
- Canvas resolution: 4096x4096 (CANVAS_SIZE constant)
- Framework: React with TypeScript
- 3D rendering: Three.js with @react-three/fiber
- **NEW Canvas library**: SVG + react-moveable (replacing Konva)
- Existing context: OverlayTextureContext provides `canvas`, `context`, and `triggerTextureUpdate()`

## 🚀 MIGRATION PLAN: Konva → SVG + React-Moveable

### Why Migrate from Konva?
1. **Simpler Implementation**: SVG is native to browsers, no additional canvas complexity
2. **Better Performance**: Lighter weight than Konva for simple text manipulation
3. **React Integration**: SVG elements work seamlessly with React patterns
4. **Moveable Library**: react-moveable provides powerful transform controls
5. **Smaller Bundle**: Removing Konva reduces bundle size significantly

### Migration Strategy

#### Phase 1: Complete Konva Cleanup (Clean Slate Approach)
1. **Remove Konva dependencies**: `npm uninstall konva react-konva`
2. **Replace TextureEditor.tsx**: Simple placeholder with "Sample Text"
3. **Remove EditableText.tsx**: Delete the entire file
4. **Rename helpers**: `konvaHelpers.ts` → `svgHelpers.ts` and clean up
5. **Test clean state**: Verify app runs without any Konva references
6. **Clean CLAUDE.md**: Remove all Konva-related documentation

#### Phase 2: SVG + React-Moveable Setup
7. **Install react-moveable**: `npm install react-moveable`
8. **Create SVG structure**: Build new TextureEditor with SVG viewport
9. **Add canvas sync**: Implement SVG → Canvas synchronization

#### Phase 3: Implementation & Testing
10. **Implement interactions**: Add react-moveable for text manipulation
11. **Test integration**: Verify 3D model texture updates work
12. **Update CLAUDE.md**: Document new SVG + react-moveable approach

### New Technology Stack
- **UI Framework**: React 19 + TypeScript
- **Text Editing**: SVG `<text>` elements  
- **Transforms**: react-moveable library
- **Canvas Export**: SVG → Canvas via canvas 2D context
- **3D Integration**: Existing OverlayTextureContext system

## 🏗️ NEW SVG + REACT-MOVEABLE ARCHITECTURE

### Component Structure
```
TextureEditor (SVG-based)
└── SVG viewport (4096x4096 viewBox, scaled to fit container)
    ├── Background rect (stencil pattern)
    ├── Text elements (SVG <text>)
    └── Moveable wrapper (transform controls)
```

### Core Implementation Approach

#### 1. SVG Viewport Setup
```typescript
<div style={{ width: '100%', height: '100%', aspectRatio: '1/1' }}>
  <svg
    viewBox="0 0 4096 4096"
    style={{ width: '100%', height: '100%' }}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Background pattern */}
    <rect
      width="4096"
      height="4096"
      fill={baseColor}
      style={{ backgroundImage: 'url(/overlay_stencil.png)' }}
    />
    
    {/* Text elements */}
    {textElements.map(element => (
      <text
        key={element.id}
        x={element.x}
        y={element.y}
        fontSize={element.fontSize}
        fill={element.fill}
        transform={`rotate(${element.rotation} ${element.x} ${element.y})`}
      >
        {element.text}
      </text>
    ))}
  </svg>
</div>
```

#### 2. React-Moveable Integration
```typescript
import Moveable from "react-moveable"

{selectedId && (
  <Moveable
    target={textRefs.current[selectedId]}
    draggable={true}
    resizable={true}
    rotatable={true}
    onDrag={({ target, transform }) => {
      target.style.transform = transform
      updateTextElement(selectedId, extractTransformValues(transform))
    }}
    onResize={({ target, width, height, transform }) => {
      target.style.transform = transform
      updateTextElement(selectedId, { 
        fontSize: calculateFontSize(width, height),
        ...extractTransformValues(transform)
      })
    }}
    onRotate={({ target, transform }) => {
      target.style.transform = transform
      updateTextElement(selectedId, extractTransformValues(transform))
    }}
  />
)}
```

#### 3. SVG to Canvas Synchronization
```typescript
const syncSVGToCanvas = useCallback(() => {
  if (!svgRef.current || !overlayTexture) return
  
  try {
    // Method 1: SVG to Canvas via foreignObject
    const svgElement = svgRef.current
    const svgData = new XMLSerializer().serializeToString(svgElement)
    const img = new Image()
    
    img.onload = () => {
      overlayTexture.context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
      overlayTexture.context.drawImage(img, 0, 0)
      overlayTexture.triggerTextureUpdate()
    }
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  } catch (error) {
    console.error('SVG to canvas sync failed:', error)
  }
}, [overlayTexture])
```

#### 4. Text Element Management
```typescript
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

const [textElements, setTextElements] = useState<TextElement[]>([{
  id: 1,
  text: "Sample Text",
  x: 400,
  y: 800,
  fontSize: 320,
  fill: '#ff0000',
  rotation: 0,
  scaleX: 1,
  scaleY: 1
}])
```

### Benefits of SVG + React-Moveable Approach

#### Advantages Over Konva
1. **Native Browser Support**: No additional canvas library needed
2. **React-First**: SVG elements work naturally with React state and props
3. **Lighter Bundle**: Significantly smaller than Konva + react-konva
4. **Better Performance**: Less overhead for simple text manipulation
5. **Flexible Styling**: CSS and SVG styling options
6. **Accessible**: Screen readers can parse SVG text content

#### Technical Benefits
- **Simpler Coordinate System**: Direct SVG coordinates, no scaling conversion needed
- **Natural Responsiveness**: SVG viewBox automatically handles scaling
- **CSS Integration**: Standard CSS transforms and animations work
- **Debug-Friendly**: Inspectable DOM elements instead of canvas pixels
- **SEO-Friendly**: Text content is part of the DOM

### Implementation Steps

#### Phase 1: Complete Konva Cleanup (Clean Slate)

##### Step 1: Remove Konva Dependencies
```bash
npm uninstall konva react-konva
```

##### Step 2: Create Simple TextureEditor Placeholder
```typescript
// TextureEditor.tsx - Simple placeholder
export function TextureEditor({ baseColor }: TextureEditorProps) {
  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      aspectRatio: '1/1',
      backgroundColor: baseColor 
    }}>
      <div style={{ fontSize: '2rem', color: '#333' }}>
        Sample Text
      </div>
    </div>
  )
}
```

##### Step 3: Remove EditableText Component
```bash
rm src/components/texture-editor/EditableText.tsx
```

##### Step 4: Clean Up Helper Files
```bash
mv src/components/texture-editor/utils/konvaHelpers.ts src/components/texture-editor/utils/svgHelpers.ts
```
Update svgHelpers.ts to remove Konva-specific constants and add SVG utilities.

##### Step 5: Test Clean State
- Start dev server: `npm run dev`
- Navigate to localhost:3000
- Verify texture editor shows "Sample Text" placeholder
- Confirm no Konva-related errors in console
- Ensure app runs completely without Konva dependencies

##### Step 6: Clean CLAUDE.md Documentation
- Remove all Konva/react-konva references
- Remove dual-stage architecture documentation
- Keep only essential project context
- Remove performance optimizations specific to Konva

#### Phase 2: SVG + React-Moveable Implementation

##### Step 7: Install React-Moveable
```bash
npm install react-moveable
```

##### Step 8: Create SVG-Based TextureEditor
- Replace placeholder with SVG viewport
- Add background pattern support
- Implement text rendering with SVG `<text>` elements

##### Step 9: Add Canvas Synchronization
- Implement SVG → Canvas conversion
- Connect to existing OverlayTextureContext
- Verify 3D model texture updates

##### Step 10: Implement React-Moveable Interactions
- Add text selection
- Implement drag/resize/rotate with react-moveable
- Update text element state on transformations

#### Phase 3: Testing & Documentation

##### Step 11: Integration Testing
- Test all text manipulation features
- Verify 3D model integration works
- Performance testing vs original Konva version
- Error handling and edge cases

##### Step 12: Update CLAUDE.md
- Document new SVG + react-moveable architecture
- Add development workflow for SVG approach
- Update MCP tool usage instructions

### Files to Change

#### Phase 1: Cleanup (Remove/Replace)
- ❌ **`package.json`**: Remove konva and react-konva dependencies
- ❌ **`EditableText.tsx`**: Delete entire file
- ❌ **`TextureEditor.tsx`**: Replace with simple placeholder component
- ❌ **`utils/konvaHelpers.ts`**: Rename to `svgHelpers.ts` and clean up
- ❌ **`CLAUDE.md`**: Remove all Konva-related documentation

#### Phase 2: Implementation (Create/Update)
- ✏️ **`package.json`**: Add react-moveable dependency
- ✏️ **`TextureEditor.tsx`**: Implement SVG + react-moveable version
- ✏️ **`utils/svgHelpers.ts`**: Add SVG utility functions
- ✏️ **`CLAUDE.md`**: Document new SVG approach (after completion)

#### Keep Unchanged
- ✅ **Integration in main app**: TextureEditor component interface unchanged
- ✅ **OverlayTextureContext**: Canvas sync pipeline remains the same
- ✅ **3D model integration**: Texture application unchanged
- ✅ **Component props**: TextureEditorProps interface maintained

### SVG-Specific Implementation Details

#### Background Pattern Implementation
```typescript
// SVG pattern definition
<defs>
  <pattern id="stencilPattern" patternUnits="userSpaceOnUse" width="4096" height="4096">
    <image href="/overlay_stencil.png" width="4096" height="4096" />
  </pattern>
</defs>

// Background rectangle with pattern
<rect 
  width="4096" 
  height="4096" 
  fill={baseColor}
  style={{ mask: 'url(#stencilPattern)' }}
/>
```

#### Text Positioning and Scaling
```typescript
// SVG text element with proper positioning
<text
  ref={el => textRefs.current[element.id] = el}
  x={element.x}
  y={element.y}
  fontSize={element.fontSize}
  fill={element.fill}
  textAnchor="start"
  dominantBaseline="hanging"
  transform={`
    translate(${element.x}, ${element.y})
    rotate(${element.rotation})
    scale(${element.scaleX}, ${element.scaleY})
    translate(${-element.x}, ${-element.y})
  `}
  style={{ cursor: 'pointer' }}
  onClick={() => setSelectedId(element.id)}
>
  {element.text}
</text>
```

#### React-Moveable Configuration
```typescript
<Moveable
  target={selectedElement}
  draggable={true}
  resizable={true}
  rotatable={true}
  origin={false}
  edge={false}
  zoom={1}
  throttleDrag={0}
  throttleResize={0}
  throttleRotate={0}
  keepRatio={false}
  renderDirections={["nw","n","ne","w","e","sw","s","se"]}
  onDragStart={({ target }) => {
    console.log("Drag started")
  }}
  onDrag={({ target, transform }) => {
    target.style.transform = transform
  }}
  onDragEnd={({ target }) => {
    syncSVGToCanvas()
  }}
/>
```

### Canvas Synchronization Strategies

#### Method 1: SVG Serialization (Recommended)
```typescript
const syncSVGToCanvas = () => {
  const svgElement = svgRef.current
  const svgData = new XMLSerializer().serializeToString(svgElement)
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  
  const img = new Image()
  img.onload = () => {
    overlayTexture.context.drawImage(img, 0, 0)
    overlayTexture.triggerTextureUpdate()
    URL.revokeObjectURL(url)
  }
  img.src = url
}
```

#### Method 2: Canvas 2D Context Drawing
```typescript
const syncSVGToCanvas = () => {
  const ctx = overlayTexture.context
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
  
  // Draw background
  ctx.fillStyle = baseColor
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
  
  // Draw text elements
  textElements.forEach(element => {
    ctx.save()
    ctx.translate(element.x, element.y)
    ctx.rotate(element.rotation * Math.PI / 180)
    ctx.scale(element.scaleX, element.scaleY)
    ctx.font = `${element.fontSize}px Arial`
    ctx.fillStyle = element.fill
    ctx.fillText(element.text, 0, 0)
    ctx.restore()
  })
  
  overlayTexture.triggerTextureUpdate()
}
```

### Testing Strategy

#### Visual Testing with Playwright MCP
1. **Screenshot Comparison**: Before/after migration visual comparison
2. **Interaction Testing**: Drag, resize, rotate functionality
3. **3D Model Integration**: Verify texture updates on robot model
4. **Performance Testing**: Check for smooth interactions

#### Unit Testing Approach
1. **Component Rendering**: SVG elements render correctly
2. **Transform Logic**: Text positioning and scaling calculations
3. **Canvas Sync**: SVG to canvas conversion accuracy
4. **State Management**: Text element CRUD operations

### Performance Considerations

#### SVG Optimization
- Use `pointer-events="none"` on non-interactive elements
- Minimize DOM updates with React.memo and useMemo
- Debounce canvas sync to avoid excessive updates
- Use CSS transforms for smooth animations

#### Memory Management
- Clean up object URLs after canvas sync
- Remove event listeners on component unmount
- Use WeakMap for element references if needed

### Migration Timeline

#### Phase 1: Complete Cleanup (Day 1 - Morning)
1. **Backup current state**: Take screenshot of working Konva version
2. **Remove dependencies**: `npm uninstall konva react-konva`
3. **Delete EditableText.tsx**: Remove the entire file
4. **Replace TextureEditor.tsx**: Simple "Sample Text" placeholder
5. **Rename helpers**: `konvaHelpers.ts` → `svgHelpers.ts`
6. **Test clean state**: Verify app runs without Konva
7. **Clean CLAUDE.md**: Remove all Konva documentation

#### Phase 2: SVG Implementation (Day 1 - Afternoon)
8. **Install react-moveable**: `npm install react-moveable`
9. **Create SVG structure**: Build TextureEditor with SVG viewport
10. **Add background**: Implement stencil pattern in SVG
11. **Basic text rendering**: SVG `<text>` elements display

#### Phase 3: Interactions & Testing (Day 2)
12. **Add react-moveable**: Implement drag/resize/rotate
13. **Canvas synchronization**: SVG → Canvas → 3D model
14. **Integration testing**: Verify all functionality works
15. **Performance testing**: Compare with original
16. **Update CLAUDE.md**: Document new approach

### Success Milestones

#### Milestone 1: Clean State ✅
- App runs without any Konva references
- No console errors related to missing dependencies
- Texture editor shows simple "Sample Text" placeholder
- 3D model still renders correctly (without texture overlay)

#### Milestone 2: SVG Foundation ✅
- SVG viewport renders correctly in texture editor
- Text elements display at correct positions
- Background pattern shows properly
- Responsive scaling works with viewBox

#### Milestone 3: Full Functionality ✅
- React-moveable provides drag/resize/rotate
- SVG content syncs to canvas correctly
- 3D robot model displays updated texture
- Performance equal or better than Konva version

### Success Criteria
- ✅ Text elements render in SVG at correct positions
- ✅ React-moveable provides drag/resize/rotate functionality
- ✅ SVG content syncs to canvas correctly
- ✅ 3D robot model displays updated texture
- ✅ Performance is equal or better than Konva version
- ✅ Bundle size is reduced
- ✅ No regressions in existing functionality

### Fallback Plan
If SVG + react-moveable approach encounters issues:
1. Keep existing Konva files as backup
2. Implement hybrid approach (SVG UI + Canvas export)
3. Consider alternative libraries (fabric.js, paper.js)
4. Revert to Konva with performance optimizations

## Quick Start for AI Agents

### Phase 1: Clean Slate Migration Workflow
1. **Backup Current State**: Take screenshot of working Konva version with Playwright MCP
2. **Remove Dependencies**: `npm uninstall konva react-konva`
3. **Create Placeholder**: Replace TextureEditor.tsx with simple "Sample Text" component
4. **Delete EditableText**: Remove EditableText.tsx file completely
5. **Rename Helpers**: `konvaHelpers.ts` → `svgHelpers.ts` and clean up
6. **Test Clean State**: Verify app runs without any Konva references
7. **Clean Documentation**: Remove Konva references from CLAUDE.md

### Phase 2: SVG Implementation Workflow
8. **Install React-Moveable**: `npm install react-moveable`  
9. **Build SVG Structure**: Create SVG viewport with 4096x4096 viewBox
10. **Add Canvas Sync**: Implement SVG → Canvas → 3D texture pipeline
11. **Implement Interactions**: Add react-moveable for text manipulation
12. **Test Integration**: Verify all functionality works end-to-end
13. **Update Documentation**: Add SVG approach to CLAUDE.md

### Verification Checklist

#### After Phase 1 (Clean State):
- ✅ `npm run dev` starts without errors
- ✅ App loads at localhost:3000
- ✅ Texture editor shows "Sample Text" placeholder
- ✅ No Konva-related console errors
- ✅ 3D robot model renders (without texture overlay)

#### After Phase 2 (SVG Implementation):
- ✅ SVG text renders at correct size and position
- ✅ React-moveable provides drag/resize/rotate
- ✅ SVG content syncs to canvas successfully  
- ✅ 3D robot model displays updated texture
- ✅ Performance is smooth and responsive

### Development Commands
```bash
npm run dev        # Start development server
npm run build      # Build for production  
npm run preview    # Preview production build
npm run lint       # Run linting
npm run typecheck  # Type checking
```

### MCP Tool Usage
- **Playwright MCP**: Visual testing and interaction verification
- **Context7 MCP**: Research react-moveable and SVG best practices
- **Development Server**: localhost:3000 for testing changes

This migration plan provides a clear path from the current Konva implementation to a cleaner, more performant SVG + react-moveable solution while maintaining all existing functionality and integration points.
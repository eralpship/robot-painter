# Robot Painting Tool - Project Context for Claude

## Project Overview
Interactive 3D web application for customizing and painting robot models in real-time. Built with React, Three.js, and TypeScript.

## Key Technologies
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **3D Graphics**: Three.js, @react-three/fiber, @react-three/drei
- **Animation**: @react-spring/three for 3D animations
- **Routing**: TanStack Router (file-based)
- **UI Controls**: Leva for real-time parameter controls
- **Window Management**: react-rnd for draggable/resizable windows
- **Texture Editor**: SVG + react-moveable for text manipulation

## Project Setup
- Generated using: `npx create-tsrouter-app@latest my-app --template file-router`
- Uses TanStack Router with file-based routing
- Routes are automatically generated from files in `/src/routes`
- Type-safe routing with TypeScript integration

## Project Structure
```
/src
  /components     # React components (E-model.tsx is the main robot component)
  /contexts       # Overlay texture canvas and tooltip contexts
  /routes         # TanStack Router file-based routes
/models          # Source 3D files (Blender, FBX) and textures
/public          # Compiled GLTF models and texture assets
```

## Development Commands
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run linting
npm run typecheck  # Type checking
```

## AI Agent Development Workflow
When working on this project as an AI agent, follow this workflow:

### 1. Start Development Server
```bash
npm run dev  # Start the development server (not npm start)
```

### 2. Visual Testing with Playwright MCP
- **Application URL**: http://localhost:3000
- **Screenshots**: Use `mcp__playwright__browser_take_screenshot()` to capture current state
- **Console Logs**: Use `mcp__playwright__browser_console_messages()` to check for errors
- **Interactions**: Use `mcp__playwright__browser_click()` to test UI elements
- **Page Structure**: Use `mcp__playwright__browser_snapshot()` to understand layout

### 3. Research Documentation with Context7 MCP
- **Documentation Research**: Use `WebFetch()` with official URLs to research best practices
- **Implementation Patterns**: Look up official documentation for component patterns
- **Performance Optimization**: Research canvas synchronization and performance tips

### 4. Testing Protocol
1. Make code changes
2. Save files (development server auto-reloads)
3. Navigate to localhost:3000 with Playwright MCP
4. Take screenshots to verify changes
5. Check browser console for errors
6. Test interactions (click, drag, transform text)
7. Verify text appears on both texture editor and 3D robot model

## Git Push Instructions
**IMPORTANT**: When pushing to remote, always use:
```bash
git push origin main && git push eralp main
```
This ensures code is pushed to both remotes (origin and eralp).

## Key Features
1. **3D Customization**: Base colors, overlay textures, lighting controls
2. **SVG Text Editor**: High-resolution SVG-based text manipulation with real-time canvas sync
3. **Interactive Text Controls**: Drag, resize, and rotate text using react-moveable
4. **Interactive Lighting**: Headlights, taillights with customizable properties
5. **Animation**: Lid opening/closing, auto-rotation, flag interactions
6. **Window Management**: Draggable and resizable texture editor window
7. **Tooltip System**: Context-aware tooltips that follow mouse position

## Important Files
- `src/components/E-model.tsx` - Main robot 3D model component
- `src/contexts/OverlayTextureCanvasContext.tsx` - Texture painting context
- `src/components/texture-editor/TextureEditor.tsx` - SVG-based text editor component
- `src/components/texture-editor/utils/svgHelpers.ts` - SVG utility functions
- `src/routes/index.tsx` - Main application route
- `public/e-model.gltf` - Compiled 3D robot model
- `public/textures/` - Texture assets (with _d, _n, _s suffixes for diffuse, normal, specular)

## 3D Model Workflow
- **Source Models**: Edit Blender files in `/models` folder
- **Export Process**: After editing in Blender, export as GLTF format
- **Deployment**: Copy exported `.gltf` and `.bin` files to `/public/`
- **Note**: The `/models` folder contains source Blender files and is the authoritative source for 3D model edits

## Material and Mesh Management (CRITICAL - DO NOT MODIFY)

### Canvas-Based Dynamic Texturing System
The project uses a sophisticated material swapping system that enables real-time texture painting:

1. **Canvas as Live Texture**: An HTML canvas replaces the original GLTF texture, allowing real-time painting
   - Canvas is created once in `OverlayTextureCanvasProvider` and shared via React Context
   - Original texture's properties are cloned to maintain UV mapping
   - Canvas updates are reflected immediately on the 3D model
   - Resolution is defined in `OVERLAY_TEXTURE_SIZE` constant

2. **Dual-Layer Rendering with PaintableMesh Component**
   - **DO NOT** duplicate geometry data - meshes share the same geometry reference
   - **Layer 1**: Base color mesh (opaque, solid color)
   - **Layer 2**: Overlay mesh (transparent, painted texture)
   - Both layers render in a group to prevent z-fighting

3. **Material Management Pattern**
   ```typescript
   // Pattern: Clone original material, modify properties, assign to new use
   const baseColorMaterial = materials['body paintable new'].clone()
   baseColorMaterial.map = null  // Remove texture for solid color
   materials.baseColor = baseColorMaterial
   ```

4. **Dynamic Material Updates**
   - Materials are modified after GLTF loading, not in the source file
   - Use `material.needsUpdate = true` after color/property changes
   - Overlay tint color multiplies with painted texture

### Why This Architecture (DO NOT CHANGE)
- **Performance**: Shared geometry reduces memory usage
- **Flexibility**: Separate base/overlay allows color changes without repainting
- **Real-time**: Canvas updates bypass texture loading delays
- **Quality**: High resolution maintains detail at all zoom levels

**IMPORTANT**: This dual-mesh approach is intentional and critical for the painting functionality. Never consolidate into a single mesh or remove the canvas-based texture system.

## SVG + React-Moveable Texture Editor Architecture

### Technology Stack
- **SVG Elements**: Native `<text>` elements for crisp, scalable text rendering
- **React-Moveable**: Provides drag, resize, and rotate interactions
- **Canvas Synchronization**: SVG serialization → Image → Canvas → 3D texture pipeline
- **High Resolution**: 4096x4096 viewBox for detailed texture output

### Key Components
1. **SVG Viewport**: 4096x4096 viewBox scaled to fit container using CSS
2. **Background Pattern**: SVG `<pattern>` and `<mask>` for stencil overlay
3. **Text Elements**: SVG `<text>` with transform matrices for positioning
4. **Moveable Controls**: Interactive transform handles for selected elements

### Canvas Sync Pipeline
```typescript
SVG → XMLSerializer → Blob → Image → Canvas.drawImage() → 3D Texture Update
```

### Benefits Over Previous Konva Implementation
- **Lighter Bundle**: No external canvas library dependency
- **Native Browser Support**: SVG is built into all modern browsers  
- **React Integration**: SVG elements work naturally with React state
- **Debug-Friendly**: DOM elements are inspectable, not canvas pixels
- **Performance**: Less overhead for simple text manipulation tasks

## Code Style Guidelines
- Use TypeScript strict mode
- Follow existing component patterns
- Preserve 3D rendering optimizations
- Maintain responsive design principles

## Documentation and API Reference
**IMPORTANT**: Before making implementation plans or decisions, always consult official documentation using available documentation tools:

1. **For all project dependencies** (React, Three.js, @react-three/fiber, @react-three/drei, @react-spring/three, TanStack Router, Leva, react-rnd, Vite):
   - Use context7 MCP server with `WebFetch()` to lookup official documentation
   - Never assume API details or make implementation plans without checking docs first
   - Always verify API signatures, available methods, and configuration options

2. **Required for**:
   - Adding new features or components
   - Debugging API usage issues
   - Updating dependencies
   - Learning new library capabilities
   - Troubleshooting build or runtime errors

3. **Specific for SVG and react-moveable work**:
   - Research SVG to canvas synchronization patterns
   - Look up react-moveable API documentation and best practices
   - Verify SVG event handling and transform calculations

**Never make assumptions about library capabilities without consulting the official documentation first.**

### MCP Tools Available
- **Playwright MCP**: For visual testing, screenshots, console logs, and UI interactions
- **Context7 MCP**: For documentation research and API lookup via `WebFetch()`
- **Development Server**: Always use `npm run dev` (not `npm start`) for the development server


## Key Component Interfaces

### ModelRef Interface
The main robot model exposes these methods via ref:
- `updateBaseColor(color: string)`: Updates the base solid color
- `updateOverlayTintColor(color: string)`: Updates the overlay texture tint
- `touchFlag()`: Triggers the flag animation

### Performance Considerations
- Canvas updates occur at controlled intervals to balance responsiveness and performance
- Texture size is configurable via `OVERLAY_TEXTURE_SIZE` constant
- Material updates use `needsUpdate` flag for efficient rendering
- Geometry sharing prevents memory duplication

## Animation System
- **Lid Animation**: Uses Three.js AnimationClip from GLTF with `useAnimations` hook
- **Flag Animation**: React Spring for smooth physics-based motion triggered by clicks
- **Light Transitions**: Animated intensity changes for headlights/taillights using `useSpring`
- **Auto-rotation**: Configurable via Leva controls

## Interaction System
- **Raycasting**: Mouse interactions use Three.js raycaster for precise object detection
- **Hitboxes**: Invisible spheres around lights enable click detection
- **Tooltip System**: Context-based tooltips follow mouse position with edge detection
- **Click Handlers**: Separate handlers for different object types (lid, lights, flag)

## Common Patterns (IMPORTANT)
1. **useLoader with Loading Manager**: Custom loading manager handles texture replacement
2. **useImperativeHandle**: ModelRef exposes methods for external control
3. **useFrame**: Animation loops and raycasting happen in render loop
4. **Material Cloning**: Always clone materials before modification to avoid shared state issues
5. **Geometry Sharing**: Never duplicate geometry - use references for performance
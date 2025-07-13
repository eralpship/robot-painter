# Robot Painting Tool - Project Context for Claude

## Project Overview
Interactive 3D web application for customizing and painting robot models in real-time. Built with React, Three.js, and TypeScript.

## Key Technologies
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **3D Graphics**: Three.js, @react-three/fiber, @react-three/drei
- **Routing**: TanStack Router (file-based)
- **UI Controls**: Leva
- **Testing**: Vitest

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
npm run test       # Run tests
npm run lint       # Run linting
npm run typecheck  # Type checking
```

## Git Push Instructions
**IMPORTANT**: When pushing to remote, always use:
```bash
git push origin main && git push eralp main
```
This ensures code is pushed to both remotes (origin and eralp).

## Key Features
1. **3D Customization**: Base colors, overlay textures, lighting controls
2. **Texture Painting**: 4096x4096 canvas with real-time preview
3. **Interactive Lighting**: Headlights, taillights with customizable properties
4. **Animation**: Lid opening/closing, auto-rotation, touch flags

## Important Files
- `src/components/E-model.tsx` - Main robot 3D model component
- `src/contexts/OverlayTextureCanvasContext.tsx` - Texture painting context
- `src/routes/index.tsx` - Main application route
- `public/model/E.glb` - Compiled 3D robot model
- `public/textures/` - Texture assets

## 3D Model Workflow
- **Source Models**: Edit Blender files in `/models` folder
- **Export Process**: After editing in Blender, export as GLTF format
- **Deployment**: Copy exported `.gltf` and `.bin` files to `/public/model/`
- **Note**: The `/models` folder contains source Blender files and is the authoritative source for 3D model edits

## Code Style Guidelines
- Use TypeScript strict mode
- Follow existing component patterns
- Preserve 3D rendering optimizations
- Maintain responsive design principles

## Testing Approach
- Unit tests with Vitest
- Component testing for UI elements
- 3D interaction testing considerations
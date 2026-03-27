# Robot Painting Tool - Finish Plan

## Validation
Use chrome-devtools MCP plugin to view http://localhost:3000 and validate changes visually after each task.

## Tasks

### 1. Visual Polish: Background & Shadows
- [x] Replace HDR visible background with clean solid color (keep HDR for reflections only via `scene.environment`)
- [x] Replace ContactShadows with real directional light shadow (castShadow/receiveShadow)
- [x] Remove Leva background controls that no longer apply (backgroundIntensity, backgroundBlur)

### 2. Visual Polish: Flag Lights (skipped for now)
- [ ] Add point lights to the flag pole (matching original Starship robot)

### 3. Texture Editor: Polygon Drawing Tool
- [x] Add `polygonElementSchema` to Zod schema (points array + color)
- [x] Add polygon type to texture editor context
- [x] Add drawing mode state (isDrawingPolygon, vertices, finish/cancel)
- [x] Mouse interaction: click to place vertices, double-click/click-first to close, Escape to cancel
- [x] Render drawing preview (polyline + vertex dots)
- [x] Render completed polygon elements (`<polygon>` SVG)
- [x] Moveable integration (disable during draw, allow non-uniform scale)
- [x] PolygonToolbar.tsx (color picker)
- [x] AddElementDropdown: add "Polygon" option
- [x] Toolbar wiring

### 3b. Texture Editor: Copy/Paste/Duplicate
- [x] Copy element (Ctrl+C) to clipboard
- [x] Paste element (Ctrl+V) onto current side (cross-side paste)
- [x] Duplicate element (Ctrl+D) in place with offset
- [x] Toolbar buttons

### 4. Texture Editor: Font Selection
- [x] Bundle curated Google Fonts via @fontsource
- [x] Add font dropdown to text toolbar
- [x] Store font name in element data
- [x] Render text with selected font

### 5. Landing Page
- [x] Create homepage route explaining the app
- [x] Link to create project / browse projects

### 6. First-Time Experience
- [x] Improve projects page with back link

### 7. Demo Robots
- [ ] Design sample robot projects to showcase the app

### 8. Bug Sweep
- [ ] Systematic testing of all features
- [ ] Fix any issues found

### 9. Mobile Responsiveness (Low Priority)
- [ ] Basic usability on mobile screens

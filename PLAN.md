# Robot Painting Tool - Finish Plan

## Validation
Use chrome-devtools MCP plugin to view http://localhost:3000 and validate changes visually after each task.

## Tasks

### 1. Visual Polish: Background & Shadows
- [ ] Replace HDR visible background with clean solid color (keep HDR for reflections only via `scene.environment`)
- [ ] Replace ContactShadows with real directional light shadow (castShadow/receiveShadow)
- [ ] Remove Leva background controls that no longer apply (backgroundIntensity, backgroundBlur)

### 2. Visual Polish: Flag Lights
- [ ] Add point lights to the flag pole (matching original Starship robot)

### 3. Texture Editor: Polygon Drawing Tool
- [ ] Add `polygonElementSchema` to Zod schema (points array + color)
- [ ] Add polygon type to texture editor context
- [ ] Add drawing mode state (isDrawingPolygon, vertices, finish/cancel)
- [ ] Mouse interaction: click to place vertices, double-click/click-first to close, Escape to cancel
- [ ] Render drawing preview (polyline + vertex dots)
- [ ] Render completed polygon elements (`<polygon>` SVG)
- [ ] Moveable integration (disable during draw, allow non-uniform scale)
- [ ] PolygonToolbar.tsx (color picker)
- [ ] AddElementDropdown: add "Polygon" option
- [ ] Toolbar wiring

### 4. Texture Editor: Font Selection
- [ ] Bundle curated Google Fonts via @fontsource
- [ ] Add font dropdown to text toolbar
- [ ] Store font name in element data
- [ ] Render text with selected font

### 5. Landing Page
- [ ] Create homepage route explaining the app
- [ ] Link to create project / browse projects
- [ ] Show demo robot preview

### 6. First-Time Experience
- [ ] Improve flow for new users with no projects
- [ ] Guide to creating first project

### 7. Demo Robots
- [ ] Design sample robot projects to showcase the app

### 8. Bug Sweep
- [ ] Systematic testing of all features
- [ ] Fix any issues found

### 9. Mobile Responsiveness (Low Priority)
- [ ] Basic usability on mobile screens

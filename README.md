# Robot Painter

Design and customize Starship delivery robots with a web-based texture editor and 3D preview.

## Getting Started

```bash
npm install
npm run start
```

Opens at http://localhost:4242

## Scripts

| Command | Description |
|---------|-------------|
| `npm run start` | Dev server on port 4242 |
| `npm run build` | Production build (vite + tsc) |
| `npm run lint` | Lint with Biome |
| `npm run check` | Biome check (lint + format) |
| `npm run format` | Auto-format with Biome |
| `npm run test` | Run tests (Vitest) |
| `npm run gltfjsx` | Print gltfjsx reference component to console |

## 3D Model Workflow

The robot model lives in `models/e-model/e-model.blend`.

### Exporting from Blender

1. Open `models/e-model/e-model.blend` in Blender
2. File > Export > glTF 2.0
3. Export settings:
   - Animation Mode: **Actions**
   - Merge Animation: **Actions**
4. Export to `models/e-model/e-model.gltf`
5. Copy to public: `cp models/e-model/e-model.{gltf,bin} public/`

### Updating the React Component

After exporting, compare the generated reference with the current component:

```bash
npm run gltfjsx
```

This prints the gltfjsx-generated component to the console. **Adapt** changes to `src/components/E-model.tsx` manually — don't replace the file, as it contains custom logic (animations, interactions, textures, shadows).

### Animation Setup

Before exporting, ensure actions are linked to objects:

- `open lid` action on `lid` object
- `rocker` action on `robot`, `rocker-bogie`, and all wheel objects

Use the Animation Solo panel (Blender MCP script) to preview individual animations. **Always click "Restore All" before exporting.**

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

fluxCAD is Korea's first web-based 3D CAD platform that runs entirely in the browser. The project is currently in the initial development phase.

## Technology Stack

### Frontend
- React 18 + TypeScript
- Three.js for 3D rendering
- OpenCascade.js as CAD kernel
- React Three Fiber for React-Three.js integration
- Zustand for state management
- Socket.io-client for real-time communication
- Tailwind CSS for styling

### Backend (Planned)
- Node.js + Express + TypeScript
- Socket.io for real-time communication
- PostgreSQL for data storage
- Redis for session/cache management
- AWS S3 for file storage

## Development Commands

Since the project is in initial phase, you'll need to set up the development environment first:

```bash
# Initialize project (if not done)
npm init -y

# Install core dependencies
npm install react react-dom three @react-three/fiber @react-three/drei
npm install -D typescript @types/react @types/react-dom vite @vitejs/plugin-react

# Development server (once set up)
npm run dev

# Build
npm run build

# Type checking
npm run typecheck

# Linting (once ESLint is configured)
npm run lint
```

## Architecture Guidelines

### Key Technical Considerations

1. **Performance Optimization**
   - WebGL rendering performance is critical
   - OpenCascade.js WASM file is large (~30MB) - implement lazy loading
   - Use web workers for heavy computations
   - Implement level-of-detail (LOD) for complex models

2. **Real-time Collaboration**
   - Use Yjs for CRDT-based collaboration
   - Implement efficient 3D data synchronization
   - Handle network latency gracefully

3. **CAD Operations**
   - OpenCascade.js handles core CAD geometry
   - Wrap OpenCascade operations in async functions
   - Implement proper error handling for CAD operations

### Directory Structure

```
src/
├── components/      # React UI components
├── features/        # Feature modules (modeling, collaboration, etc.)
├── hooks/          # Custom React hooks
├── store/          # Zustand state management
├── utils/          # Utility functions
├── types/          # TypeScript type definitions
└── lib/            # Core library integrations (Three.js, OpenCascade)
```

### Development Priorities

1. **Phase 1 (Core MVP)**: Basic 3D viewer, simple modeling tools, file operations
2. **Phase 2 (Collaboration)**: Real-time editing, user presence, comments
3. **Phase 3 (Advanced)**: Complex modeling tools, performance optimization
4. **Phase 4 (Beta)**: Polish, testing, documentation

## Testing Approach

Tests should cover:
- CAD operations accuracy
- 3D rendering performance
- Real-time sync reliability
- Browser compatibility

## Current Development Status (Phase 4 - Advanced Features)

### Recently Completed Features

#### Advanced Modeling Tools ✅
- **Boolean Operations**: Union, Subtraction, Intersection with CSG algorithms
- **Modeling Operations**: Fillet, Chamfer, Shell, Pattern operations
- **Sketch System**: 2D sketch creation with constraints and dimensions
- **3D Conversion**: Extrude and Revolve operations from sketches

#### File I/O System ✅
- **Import Support**: STL, OBJ, STEP, glTF file formats
- **Export Support**: STL, OBJ, glTF, FluxCAD project files
- **STEP Integration**: Using occt-import-js for CAD file compatibility
- **Smart Positioning**: Automatic object placement to prevent overlaps
- **Batch Export**: Export to multiple formats simultaneously

#### Measurement Tools ✅
- **Distance Measurement**: Point-to-point distance with visual feedback
- **Angle Measurement**: Three-point angle measurement
- **Interactive UI**: Click-based measurement with ESC to cancel

#### Rendering System ✅ (Latest Update)
- **Material Library**: 20+ PBR materials organized by categories
  - Metals: Aluminum, Steel, Brass, Copper, Gold, Chrome
  - Plastics: Glossy, Matte, Colored, Transparent
  - Ceramics: Glass, Porcelain, Ceramic
  - Fabrics: Leather, Fabric, Rubber
  - Woods: Oak, Walnut, Pine
- **Advanced Lighting**: HDR environment maps, 3-point lighting setup
- **Post-Processing**: SSAO, Bloom, Tone Mapping with quality presets
- **Auto-Optimization**: Scene analysis for optimal rendering settings

### Technical Architecture

#### Core Systems
- **State Management**: Zustand stores for scene, app, history, sketch
- **3D Engine**: Three.js + React Three Fiber with WebGL optimization
- **UI Framework**: React 18 + TypeScript + Tailwind CSS
- **File System**: Extensible plugin-based import/export architecture

#### Key Components
```
src/components/
├── MaterialLibrary.tsx     # PBR material system
├── LightingSystem.tsx      # HDR lighting + environment maps
├── PostProcessing.tsx      # SSAO, Bloom, Tone Mapping
├── MeasurementTools.tsx    # Distance/angle measurement
├── ModelingTools.tsx       # Advanced CAD operations
├── BooleanTools.tsx        # CSG boolean operations
└── FileMenu.tsx           # Multi-format file operations
```

#### Development Commands
```bash
npm run dev        # Development server
npm run build      # Production build
npm run typecheck  # TypeScript validation
```

### Next Priorities
1. **Performance Optimization**: LOD, Instancing, Frustum Culling
2. **Real-time Collaboration**: Multi-user editing system

## Important Notes

- Target browsers: Chrome 90+, Firefox 88+, Safari 14+
- Requires WebGL 2.0 and WebAssembly support
- Optimize for Korean market (UI/UX, language support)
- Focus on zero-installation web experience
- Professional CAD-grade rendering quality achieved
- All UI text in Korean for target market
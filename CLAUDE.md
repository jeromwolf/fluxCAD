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

## Important Notes

- Target browsers: Chrome 90+, Firefox 88+, Safari 14+
- Requires WebGL 2.0 and WebAssembly support
- Optimize for Korean market (UI/UX, language support)
- Focus on zero-installation web experience
- Implement progressive loading for better initial load times
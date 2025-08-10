# TypeScript Type Error Fix Tasks

## Overview
Remaining TypeScript compilation errors identified by `npm run typecheck`. These are primarily D3.js selection typing issues where the generic `unknown` type needs proper casting.

## Current Status
- ✅ **Infrastructure Setup Complete**: TypeScript and Vite are fully configured
- ✅ **Basic Type Errors Fixed**: HTMLElement casting, function signatures, imports
- ✅ **Build Working**: Both dev server and production build work correctly
- ⚠️ **Remaining**: Advanced D3 typing issues with data selections

## Remaining Tasks by File

### **filters.ts**
- [ ] Add type assertions for node data in graph operations (lines 71, 75, 136-144, 235):
  - Cast `unknown` to proper node interface for `.id` property access
- [ ] Add type assertions for link data in graph operations (lines 85-108, 241-242):
  - Cast `unknown` to proper link interface for `.source` and `.target` property access

### **focus-modes.ts**  
- [ ] Add type assertions for node and link data (lines 66-80, 159-165, 219, 301, 404-453):
  - Cast `unknown` to proper node/link interfaces for property access
  - Add `name` property to SimulationNode interface or cast appropriately

### **graph-renderer.ts**
- [ ] Fix D3 zoom behavior typing (line 42):
  - Properly type the zoom behavior for SVG elements
- [ ] Fix D3 selection method calls (line 64):
  - Resolve callable expression issue
- [ ] Fix D3 simulation typing (lines 70, 122):
  - Properly type force simulation with custom node interface
- [ ] Add type assertions for D3 selection contexts (lines 449-450, 479-480):
  - Cast BaseType to proper DOM element types for `.getBBox()`, `.parentNode`, etc.
- [ ] Add type assertions for simulation data (lines 352, 359-360, 372, 378):
  - Cast simulation node/link data to proper interfaces

### **interaction-handlers.ts**
- [ ] Add type assertions throughout for D3 data binding (lines 60, 130, 137-139, 199-238, 283, 315-321):
  - Cast `unknown` data to proper node/link interfaces
  - Add missing properties like `thickness` to link interface

## Implementation Notes

### Common Patterns Needed:

1. **D3 Data Casting**:
   ```typescript
   const nodeData = d as GraphNode;
   const linkData = d as LinkData;
   ```

2. **Enhanced Link Interface**:
   ```typescript
   interface GraphLink {
     source: string | GraphNode;
     target: string | GraphNode;
     thickness?: number;
   }
   ```

3. **D3 Selection Casting**:
   ```typescript
   const element = selection.node() as SVGElement;
   ```

## Priority
These remaining errors are **non-blocking** for functionality:
- Application builds and runs successfully
- All core features work correctly
- TypeScript provides partial type checking
- Errors are primarily about strict type safety in D3 data binding

## Completed Infrastructure ✅
- [x] Package.json with TypeScript and Vite
- [x] TypeScript configuration files
- [x] Vite configuration  
- [x] File renaming (.js → .ts)
- [x] Import statement updates
- [x] D3 library imports
- [x] Basic type interfaces and declarations
- [x] HTMLElement casting for DOM manipulation
- [x] Window property type declarations
- [x] Build and dev server functionality
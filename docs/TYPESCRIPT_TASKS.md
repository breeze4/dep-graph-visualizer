# TypeScript Type Error Fix Tasks

## Overview
Tasks to fix TypeScript compilation errors identified by `npm run typecheck`. These tasks involve adding proper type annotations and fixing type-related issues.

## Tasks by File

### **file-processor.ts** ✅
- [x] Fix FileReader result type issue (line 138) - Handle `string | ArrayBuffer` type from FileReader
- [x] Add type declaration for `window.initializeVisualizationWhenReady` (lines 401-402)

### **filters.ts** ✅
- [x] Cast HTMLElement to HTMLInputElement for `.checked` property (lines 19, 20, 153, 177, 178, 205, 206)
- [x] Cast HTMLElement to HTMLInputElement for `.value` property (lines 21, 22, 168, 179, 181, 207, 208)
- [x] Fix type assignment - convert number to string for innerText (line 169)
- [x] Import missing functions `getFocusMode` and `getConnectionFocusMode` from focus-modes (lines 184-185)

### **focus-modes.ts** ✅
- [x] Add type for custom `updateCount` property on Element (lines 164, 165)
- [x] Add type for custom `updateCount` property on HTMLDivElement (line 358)
- [x] Type assertion for Element to HTMLElement for `.dataset` property (lines 526, 527, 536, 537)

### **graph-renderer.ts**
- [ ] Fix d3.forceSimulation call - provide all required arguments or use correct overload (line 62)
- [ ] Add proper type for simulation nodes with custom properties (lines 344, 351, 352, 364, 370, 472)
  - Add `id` property to SimulationNodeDatum
  - Add `size` property to node data type

### **graph-transformer.ts**
- [ ] Define proper type for node objects with properties (lines 74-78, 82, 93):
  - `linesOfCode`
  - `imports`
  - `importedBy`

### **interaction-handlers.ts**
- [ ] Fix d3.drag call - provide all required arguments or use correct overload (line 292)

### **script.ts**
- [ ] Add type declarations for window properties (lines 223, 226-231):
  - `window.initializeVisualizationWhenReady`
  - `window.toggleFocusMode`
  - `window.toggleHighlightPath`
  - `window.toggleConnectionFocus`
  - `window.isPathHighlighted`
  - `window.copyInterfaceToClipboard`
  - `window.clearMultiSelection`

### **stats-ui.ts**
- [ ] Define proper type for node objects with `imports` property (line 55)
- [ ] Fix type assignments - convert numbers to strings for innerText (lines 63-66)
- [ ] Cast HTMLElement to HTMLInputElement for `.value` property (line 264)
- [ ] Add type for custom `updateCount` property on HTMLDivElement (line 435)
- [ ] Import `showMainInterface` function from file-processor (line 449)

### **tooltips.ts**
- [ ] Fix BaseType issue - ensure proper type for D3 selection context (line 93)

## Implementation Notes

### Common Patterns to Apply:

1. **HTML Element Casting**: 
   ```typescript
   const element = document.getElementById('id') as HTMLInputElement;
   ```

2. **Window Properties Declaration**:
   ```typescript
   declare global {
     interface Window {
       propertyName: () => void;
     }
   }
   ```

3. **Custom Properties on Elements**:
   ```typescript
   interface CustomElement extends HTMLElement {
     updateCount?: number;
   }
   ```

4. **Node Data Types**:
   ```typescript
   interface GraphNode {
     id: string;
     size: number;
     linesOfCode: number;
     imports: string[];
     importedBy: string[];
   }
   ```

5. **Type Guards for Union Types**:
   ```typescript
   if (typeof result === 'string') {
     // handle string case
   }
   ```

## Priority Order
1. Start with type declarations and interfaces (graph-transformer.ts, defining data types)
2. Fix window property declarations (script.ts, file-processor.ts)
3. Fix HTML element casting issues (filters.ts, stats-ui.ts, focus-modes.ts)
4. Fix D3-specific type issues (graph-renderer.ts, interaction-handlers.ts, tooltips.ts)
5. Handle remaining edge cases

## Testing
After fixing each file, run `npm run typecheck` to verify the errors are resolved.
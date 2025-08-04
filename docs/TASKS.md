# Setup Tasks Checklist

## Notes
- No build system for frontend or backend
- Use vanilla JavaScript only (no frameworks)
- D3.js for interactive data visualizations
- Backend serves static files and provides API endpoints
- Frontend served on localhost via backend server
- Graph structure uses bidirectional adjacency list (imports/importedBy)
- Use `example/example-app/src/` as the test subject for testing the graph traversal mechanism. It is a vite/Typescript/vanilla app. Do not add any frameworks or external dependencies to this example.

## Task lists

# Frontend D3 Graph Visualization - Implementation Tasks

## Section 1: UI Structure & Layout

### HTML Structure Updates
- [x] Update index.html with main layout containers
- [x] Add upload zone container with drag/drop styling
- [x] Add graph visualization container (SVG area)
- [x] Add info panel container for file details
- [x] Add controls panel container for filters/settings
- [x] Add error/loading message containers

### CSS Layout & Styling
- [x] Create responsive grid layout (upload zone, graph, info panel)
- [x] Style drag and drop zone with visual feedback states
- [x] Create graph container with proper dimensions and borders
- [x] Style info panel with file details layout
- [x] Add loading spinner and error message styling
- [x] Ensure mobile/tablet responsive design

## Section 2: File Upload & Validation

### Drag & Drop Implementation
- [x] Implement drag over/enter/leave event handlers
- [x] Handle file drop event and extract file data
- [x] Add click-to-browse file input fallback
- [x] Show visual feedback during drag operations
- [x] Restrict to JSON files only

### JSON Processing & Validation
- [x] Create JSON file reader with error handling
- [x] Implement schema validation for metadata structure
- [x] Validate graph object structure (imports/importedBy arrays)
- [x] Check numeric fields (linesOfCode > 0)
- [x] Verify bidirectional consistency (A imports B ↔ B importedBy A)
- [x] Validate all referenced files exist in graph

### Error Handling & User Feedback
- [x] Display parsing errors with specific line numbers
- [x] Show schema validation errors with field details
- [x] Create loading state with progress indication
- [x] Add success message after successful upload
- [x] Handle edge cases (empty files, very large files)

## Section 3: D3 Graph Foundation

### SVG Setup & Zoom/Pan
- [x] Initialize D3 SVG container with proper dimensions
- [x] Implement zoom behavior with scale limits
- [x] Add pan functionality with boundary constraints
- [x] Create reset zoom/pan button functionality
- [x] Ensure smooth zoom/pan performance

### Data Transformation
- [x] Transform JSON graph to D3 nodes array format
- [x] Transform JSON imports to D3 links array format
- [x] Calculate node sizes based on lines of code
- [x] Determine node colors based on file path (apps vs libs)
- [x] Add node IDs and metadata for D3 binding

## Section 4: Graph Visualization Core

### Force Simulation Setup
- [x] Initialize D3 force simulation with appropriate forces
- [x] Configure link force for connections
- [x] Add collision detection to prevent node overlap
- [x] Set center force to keep graph centered
- [x] Add charge force for node repulsion
- [x] Fine-tune force parameters for optimal layout

### Node Rendering
- [x] Create circle elements for each file node
- [x] Size nodes based on lines of code (with min/max limits)
- [x] Apply color coding (apps = blue, libs = green)
- [x] Add node stroke and styling
- [x] Implement node dragging functionality

### Edge Rendering
- [x] Create line elements for import relationships
- [x] Add arrowhead markers to show import direction
- [x] Style edges with appropriate thickness and color
- [x] Handle edge curves to avoid node overlap
- [x] Add edge hover effects

## Section 5: Interactive Features

### Node Labels & Text
- [x] Add text labels to nodes showing file names
- [x] Implement text truncation for long file names
- [x] Position labels relative to node size
- [x] Add toggle to show/hide labels
- [x] Handle label collision detection

### Hover Tooltips
- [x] Create tooltip div with file information
- [x] Show full file path, LOC, import counts on hover
- [x] Position tooltip near mouse cursor
- [x] Add smooth show/hide transitions
- [x] Handle tooltip overflow at screen edges

### Node Selection & Info Panel
- [x] Implement node click selection (highlight selected node)
- [x] Update info panel with selected node details
- [x] Show full file path, metrics, and dependencies
- [x] List files that import this file and files this imports
- [x] Add deselection by clicking empty space

## Section 6: Controls & Filtering

### Layout Controls
- [x] Add force simulation strength slider
- [x] Create reset button for zoom/pan/layout
- [x] Add play/pause simulation button
- [x] Implement node position locking on drag
- [ ] Add layout algorithm selection (if multiple)

### Graph Statistics Display
- [x] Calculate and display total node/edge counts
- [x] Show most connected nodes (highest import counts)
- [x] Display largest files by lines of code
- [x] Add apps vs libs breakdown statistics
- [x] Update stats when filters are applied

### Filtering System
- [x] Add checkbox to show/hide apps vs libs
- [x] Create slider for minimum lines of code threshold
- [x] Implement search box with real-time filtering
- [x] Add highlight functionality for search results
- [x] Create filter reset button

## Section 7: Polish

### Performance & UX Polish
- [ ] Optimize D3 rendering for smooth animations
- [ ] Add loading states for better user experience
- [ ] Implement debouncing for search/filter inputs
- [ ] Add keyboard shortcuts for common actions
- [ ] Ensure accessibility compliance (ARIA labels, keyboard nav)

## Section 8: Documentation & Examples

### User Guide
- [ ] Add instructions text to upload zone
- [ ] Create help tooltip/modal explaining graph features
- [ ] Document keyboard shortcuts and interactions
- [ ] Add example JSON file for testing

### Code Documentation
- [ ] Add JSDoc comments to main functions
- [ ] Document D3 force simulation parameters
- [ ] Comment complex data transformation logic
- [ ] Add inline comments for graph calculations
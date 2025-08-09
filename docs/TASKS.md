# Tasks Checklist

## Notes
- No build system for frontend or backend
- Use vanilla JavaScript only (no frameworks)
- D3.js for interactive data visualizations
- Backend serves static files and provides API endpoints
- Frontend served on localhost via backend server
- Graph structure uses bidirectional adjacency list (imports/importedBy)
- Use `example/example-app/src/` as the test subject for testing the graph traversal mechanism. It is a vite/Typescript/vanilla app. Do not add any frameworks or external dependencies to this example.

## Task lists

### 1. Graph Generation CLI Tool
- [ ] 1.1 Install ts-morph dependency for TypeScript parsing
- [ ] 1.2 Update command-line parsing to accept two separate parameters (app-dir and libs-dir) instead of one
- [ ] 1.3 Remove requirement for apps/libs subdirectories within single directory
- [ ] 1.4 Initialize ts-morph project with TypeScript configuration from example app
- [ ] 1.5 Replace regex-based import parsing with ts-morph AST parsing
- [ ] 1.6 Add support for TypeScript-specific imports (type imports, interfaces, etc.)
- [ ] 1.7 Handle TypeScript path aliases and tsconfig paths mapping
- [ ] 1.8 Extract imported symbols from each import statement
- [ ] 1.9 Distinguish between type imports and value imports
- [ ] 1.10 Implement module detection by directory boundaries (each directory = module)
- [ ] 1.11 Aggregate files into module-level nodes instead of file-level
- [ ] 1.12 Add node type classification (app/lib/external) based on path
- [ ] 1.13 Transform current graph structure to spec format with nodes and edges arrays
- [ ] 1.14 Add node attributes: id, type, linesOfCode, fileCount, incomingCount, outgoingCount
- [ ] 1.15 Add edge attributes: from, to, count, symbols array
- [ ] 1.16 Implement edge aggregation that combines duplicate module imports with counts
- [ ] 1.17 Calculate incoming dependency counts for each module
- [ ] 1.18 Calculate outgoing dependency counts for each module
- [ ] 1.19 Change output path from source directory to frontend/dependency-graph.json
- [ ] 1.20 Add progress indicators during file processing
- [ ] 1.21 Update metadata section to include apps and libs counts
- [ ] 1.22 Preserve existing lines of code counting functionality at module level

### 2. Graph Visualization (Frontend)
- [ ] 2.1 Create D3 force simulation initialization with proper node/edge data binding
- [ ] 2.2 Implement node rendering with size based on incoming dependencies
- [ ] 2.3 Add node coloring based on type (app=blue, lib=green, external=gray)
- [ ] 2.4 Implement edge rendering with thickness based on dependency strength
- [ ] 2.5 Add directional arrows to edges pointing from importer to imported
- [ ] 2.6 Implement zoom and pan controls using d3.zoom()
- [ ] 2.7 Add node click handling for focus mode
- [ ] 2.8 Implement focus mode that shows node + immediate neighbors only
- [ ] 2.9 Add node hover tooltips showing basic stats
- [ ] 2.10 Implement edge hover tooltips showing import details
- [ ] 2.11 Add smooth transitions for all graph interactions
- [ ] 2.12 Implement collision detection to prevent node overlap

### 3. UI Components
- [ ] 3.1 Create information panel that displays node details on selection
- [ ] 3.2 Add incoming dependencies list to node details panel
- [ ] 3.3 Add outgoing dependencies list to node details panel  
- [ ] 3.4 Implement edge details view showing imported symbols
- [ ] 3.5 Add search functionality that filters nodes by name
- [ ] 3.6 Implement min lines of code filter slider
- [ ] 3.7 Add node type filters (show/hide apps, libs, external)
- [ ] 3.8 Create toggle for showing/hiding node labels
- [ ] 3.9 Implement reset view button that restores default zoom/pan
- [ ] 3.10 Add graph statistics display (total nodes, edges, visible count)
- [ ] 3.11 Update existing panels to show real data instead of placeholders

### 4. Data Flow Integration
- [ ] 4.1 Connect file upload to graph rendering pipeline
- [ ] 4.2 Implement graph data validation before rendering
- [ ] 4.3 Add progress indicators for graph generation
- [ ] 4.4 Create error handling for malformed graph data
- [ ] 4.5 Implement auto-load of dependency-graph.json for development
- [ ] 4.6 Add graph data caching to avoid re-parsing
- [ ] 4.7 Update statistics panels with real graph metrics

### 5. Performance Optimizations
- [ ] 5.1 Implement node virtualization for graphs with >500 nodes
- [ ] 5.2 Add lazy loading for edge details
- [ ] 5.3 Optimize force simulation parameters for smooth rendering
- [ ] 5.4 Implement debouncing for search and filter inputs
- [ ] 5.5 Add request cancellation for in-flight graph generation

### 6. Interface Extraction Feature
- [ ] 6.1 Add multi-select mode for nodes (shift-click)
- [ ] 6.2 Implement selection state management
- [ ] 6.3 Create interface extraction logic that aggregates exports
- [ ] 6.4 Add interface extraction panel to UI
- [ ] 6.5 Implement copy-to-clipboard for extracted interface
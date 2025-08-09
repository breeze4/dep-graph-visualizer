# Tasks Checklist

## Notes
- No build system for frontend or backend
- Use vanilla JavaScript only (no frameworks)
- D3.js for interactive data visualizations
- Backend serves static files and provides API endpoints
- Frontend served on localhost via backend server
- Graph structure uses bidirectional adjacency list (imports/importedBy)
- Use `example/example-app/src/` as the test subject for testing the graph traversal mechanism. It is a vite/Typescript/vanilla app. Do not add any frameworks or external dependencies to this example.
- When working through a task list, check each completed task off as its done, before starting the next task. Only do one section at a time, then wait for further instructions.

## Task lists

### 0. CLI Tool Project Setup
- [x] 0.1 Create cli-tool directory for the graph generation tool
- [x] 0.2 Move graph-main.js to cli-tool/index.js
- [x] 0.3 Create package.json in cli-tool directory with basic configuration
- [x] 0.4 Add ts-morph as a dependency in package.json
- [x] 0.5 Add npm start script to run the CLI tool
- [x] 0.6 Test that the tool runs from the new location

### 1. Graph Generation CLI Tool - Basic Setup
- [x] 1.1 Install ts-morph dependency for TypeScript parsing
- [x] 1.2 Update command-line parsing to accept two separate parameters (app-dir and libs-dir) instead of one
- [x] 1.3 Validate that both directories exist and are accessible
- [x] 1.4 Change output path from source directory to frontend/dependency-graph.json
- [x] 1.5 Remove requirement for apps/libs subdirectories within single directory
- [x] 1.6 Add progress indicators during file processing

### 2. Graph Generation CLI Tool - File Processing
- [x] 2.1 Initialize ts-morph project with TypeScript configuration from example app
- [x] 2.2 Update file traversal to work with the two separate directories
- [x] 2.3 Keep existing test file detection logic
- [x] 2.4 Keep existing lines of code counting per file

### 3. Graph Generation CLI Tool - Import Parsing
- [x] 3.1 Replace regex-based import parsing with ts-morph AST parsing
- [x] 3.2 Extract imported symbols from each import statement
- [x] 3.3 Add support for TypeScript-specific imports (type imports, interfaces, etc.)
- [x] 3.4 Distinguish between type imports and value imports
- [x] 3.5 Handle TypeScript path aliases and tsconfig paths mapping
- [x] 3.6 Resolve relative imports to absolute module paths

### 4. Graph Generation CLI Tool - Module Aggregation
- [x] 4.1 Implement module detection by directory boundaries (each directory = module)
- [x] 4.2 Aggregate files into module-level nodes instead of file-level
- [x] 4.3 Sum lines of code for all files in a module
- [x] 4.4 Count number of files per module
- [x] 4.5 Add node type classification (app/lib/external) based on path

### 5. Graph Generation CLI Tool - Graph Structure
- [x] 5.1 Transform current graph structure to spec format with nodes and edges arrays
- [x] 5.2 Add node attributes: id, type, linesOfCode, fileCount
- [x] 5.3 Create edges array with from, to attributes
- [x] 5.4 Add symbols array to each edge
- [x] 5.5 Implement edge aggregation that combines duplicate module imports with counts
- [x] 5.6 Calculate incoming dependency counts for each module
- [x] 5.7 Calculate outgoing dependency counts for each module
- [x] 5.8 Add incomingCount and outgoingCount to node attributes
- [x] 5.9 Update metadata section to include apps and libs counts

### 6. Graph Visualization - Basic Setup
- [x] 6.1 Create D3 force simulation initialization
- [x] 6.2 Bind nodes array from JSON to D3 nodes
- [x] 6.3 Bind edges array from JSON to D3 links
- [x] 6.4 Implement basic node rendering as circles
- [x] 6.5 Implement basic edge rendering as lines

### 7. Graph Visualization - Visual Encoding
- [x] 7.1 Scale node size based on incoming dependencies count
- [x] 7.2 Add node coloring based on type (app=blue, lib=green, external=gray)
- [x] 7.3 Scale edge thickness based on dependency strength (count)
- [x] 7.4 Add directional arrows to edges pointing from importer to imported
- [x] 7.5 Add node labels showing module names

### 8. Graph Visualization - Interactions
- [ ] 8.1 Implement zoom and pan controls using d3.zoom()
- [ ] 8.2 Add node click handling for selection
- [ ] 8.3 Add node hover tooltips showing basic stats
- [ ] 8.4 Add edge hover tooltips showing import details
- [ ] 8.5 Implement focus mode that shows node + immediate neighbors only
- [ ] 8.6 Add smooth transitions for all graph interactions
- [ ] 8.7 Implement collision detection to prevent node overlap

### 9. UI Components - Information Panels
- [ ] 9.1 Connect node selection to existing file details panel
- [ ] 9.2 Display node details (type, LOC, file count) in panel
- [ ] 9.3 Add incoming dependencies list to node details panel
- [ ] 9.4 Add outgoing dependencies list to node details panel
- [ ] 9.5 Implement edge details view showing imported symbols
- [ ] 9.6 Update existing panels to show real data instead of placeholders

### 10. UI Components - Controls and Filters
- [ ] 10.1 Connect search input to filter nodes by name
- [ ] 10.2 Connect min lines of code slider to filter nodes
- [ ] 10.3 Connect node type checkboxes to show/hide apps, libs
- [ ] 10.4 Connect toggle for showing/hiding node labels
- [ ] 10.5 Connect reset view button to restore default zoom/pan
- [ ] 10.6 Update graph statistics display with real counts

### 11. Data Flow Integration
- [ ] 11.1 Update file upload to work with new graph structure
- [ ] 11.2 Update graph data validation for new format
- [ ] 11.3 Fix auto-load to use new graph structure
- [ ] 11.4 Update progress indicators for new data format
- [ ] 11.5 Update error handling for new graph format
- [ ] 11.6 Add graph data caching to avoid re-parsing
- [ ] 11.7 Connect all statistics panels with real graph metrics

### 12. Performance Optimizations
- [ ] 12.1 Test performance with large graphs
- [ ] 12.2 Implement node virtualization for graphs with >500 nodes if needed
- [ ] 12.3 Add lazy loading for edge details if needed
- [ ] 12.4 Optimize force simulation parameters for smooth rendering
- [ ] 12.5 Verify debouncing works for search and filter inputs

### 13. Interface Extraction Feature
- [ ] 13.1 Add shift key detection for multi-select mode
- [ ] 13.2 Implement selection state management for multiple nodes
- [ ] 13.3 Create interface extraction logic that aggregates exports
- [ ] 13.4 Add interface extraction panel to UI
- [ ] 13.5 Implement copy-to-clipboard for extracted interface
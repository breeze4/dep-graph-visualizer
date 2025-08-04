# Setup Tasks Checklist

## Technical Infrastructure Setup

### Backend (Node.js + Express)
- [x] Create initial backend server setup with Express
- [x] Set up static file serving for frontend directory
- [x] Create API endpoint stub for dependency data
- [x] Test server startup and static file serving

### Frontend (Vanilla JS + D3.js)
- [x] Create basic frontend HTML structure
- [x] Add D3.js library to frontend via CDN
- [x] Create initial CSS file for styling
- [x] Set up basic vanilla JS app structure

## Dependency Analysis Implementation

### Core Analysis Features
- [x] Create recursive directory traversal function within graph-main.js
- [x] Implement file type detection (JS/TS files, test files)
- [x] Create import parser to extract dependencies from files
- [x] Build graph data structure with imports and importedBy
- [x] Traverse both `apps` and `libs` directories with the target directory. If either apps and libs don't exist, throw an error
- [x] Add line counting for code and test files
- [x] Ignore 3rd party/external imports - only graph out imports from within this project
- [x] Generate output JSON file with graph data
- [x] Add progress logging during analysis

### Make a richer example app
- [x] Add tests for example app, meaning add test files within it to test the traversal
- [x] Add more apps and libs, use very basic boilerplate code that has plenty of imports

## Notes
- No build system for frontend or backend
- Use vanilla JavaScript only (no frameworks)
- D3.js for interactive data visualizations
- Backend serves static files and provides API endpoints
- Frontend served on localhost via backend server
- Graph structure uses bidirectional adjacency list (imports/importedBy)
- Use `example/example-app/src/` as the test subject for testing the graph traversal mechanism. It is a vite/Typescript/vanilla app. Do not add any frameworks or external dependencies to this example.
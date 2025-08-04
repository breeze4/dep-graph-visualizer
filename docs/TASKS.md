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
- [ ] Create recursive directory traversal function within graph-main.js
- [ ] Implement file type detection (JS/TS files, test files)
- [ ] Create import parser to extract dependencies from files
- [ ] Build graph data structure with imports and importedBy
- [ ] Traverse both `apps` and `libs` directories with the target directory. If either apps and libs don't exist, throw an error
- [ ] Add line counting for code and test files
- [ ] Ignore 3rd party/external imports - only graph out imports from within this project
- [ ] Generate output JSON file with graph data
- [ ] Add progress logging during analysis

## Notes
- No build system for frontend or backend
- Use vanilla JavaScript only (no frameworks)
- D3.js for interactive data visualizations
- Backend serves static files and provides API endpoints
- Frontend served on localhost via backend server
- Graph structure uses bidirectional adjacency list (imports/importedBy)
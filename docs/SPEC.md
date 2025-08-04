# Dependency Graph Visualizer - Specification

## Project Overview

A web application that visualizes dependency graphs using vanilla JavaScript frontend and Node.js backend.

## Architecture

### Backend (Node.js + Express)
- **Purpose**: Serve static files and provide API endpoints for dependency data
- **Technology**: Node.js with Express framework
- **Port**: 3000 (configurable via PORT environment variable)
- **Static Files**: Serves frontend files from `/frontend` directory

### Frontend (Vanilla JavaScript)
- **Purpose**: Interactive web interface for dependency visualization
- **Technology**: HTML5, CSS3, vanilla JavaScript
- **Location**: `/frontend` directory
- **Entry Point**: `index.html`

## Project Structure

```
dep-graph-visualizer/
├── backend/
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── script.js
├── docs/
│   └── SPEC.md
└── .gitignore
```

## Getting Started

1. Install dependencies: `cd backend && npm install`
2. Start server: `npm start` or `npm run dev`
3. Open browser to `http://localhost:3000`

## Development Guidelines

- Keep frontend vanilla JavaScript (no frameworks)
- Backend serves as static file server and API provider
- Follow atomic, incremental development approach
- Maintain functionality after each change


## Features

### Core Functionality
- Analyze JavaScript/TypeScript repositories to map internal dependency graphs
- Perform depth-first directory traversal to build a recursive data structure
- Trace imports in code files (excluding tests) to create dependency connections
- Count lines of code for both production and test files
- Ignore external packages (package.json dependencies) for now

### Data Analysis
- Identify modules that are heavily depended upon
- Track modules with many dependencies
- Separate apps (diverse library collections with behavior) from libs (small related code groups)
- Track 3rd party dependencies for each app/lib

### Graph representation
This data structure is a **Dependency Graph** represented as a JSON object.

-   The top-level keys are **strings**, each representing the unique relative path to a file (a **node** in the graph).
-   Each file node has a value which is an object containing two properties:
    -   `imports`: An array of strings, where each string is a path to a file that the current file *depends on* (outgoing edges).
    -   `importedBy`: An array of strings, where each string is a path to a file that *depends on* the current file (incoming edges).

Essentially, it's an adjacency list representation of a directed graph that explicitly stores both forward and reverse edges for every node, allowing for efficient bi-directional traversal.

### Visualization Hierarchy
- Top level: Show apps and libs separately
- Apps display: size (code + test), 3P dependency count, libs used
- Libs display: size (code + test), 3P dependencies, other lib dependencies
- Drill-down navigation: apps/libs → modules → directories → files
- Group modules by their package.json
- Support visualization inside modules (e.g., for monolithic Angular apps)

### Visual Elements
- Draw connection lines between dependent modules
- Visual indicators for dependency count (incoming/outgoing)
- Code size representations
- Show number of modules that depend on each module
- Show number of modules each module depends on

### Command Line Interface
- Execute via: `node graph-main.js "./example/example-app/src"`
- Automatically identify and separate apps and libs from the source path

### Future features:
* External modules graph, put together a list of all external package imports/dependencies


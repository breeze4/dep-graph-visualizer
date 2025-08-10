# Dependency Graph Visualizer

Visualizes JavaScript/TypeScript project dependencies as interactive graphs using D3.js.

## Overview

Analyzes internal dependencies in JS/TS repositories, separating apps and libs, and provides drill-down navigation from high-level modules to individual files.

## Architecture

The project consists of three main components:

### Backend (`/backend`)
- **Node.js + Express** API server
- Serves static files and provides API endpoints
- File analysis and dependency extraction
- Graph data processing and transformation

### Frontend (`/frontend`) 
- **Vite + TypeScript + D3.js** visualization
- Interactive force-directed graph rendering
- Filtering, search, and navigation controls
- Performance optimizations for large graphs

### CLI Tool (`/cli-tool`)
- Command-line interface for dependency analysis
- Generates dependency graphs from source code
- Outputs structured JSON data

## Quick Start

### Backend Setup
```bash
cd backend
npm install
npm start
# Server runs on http://localhost:3000
```

### Frontend Development  
```bash
cd frontend
npm install
npm run dev
# Dev server runs on http://localhost:5173
```

### CLI Usage
```bash
cd cli-tool
npm install
node index.js "./example/example-app/src"
```

## Development Commands

### Frontend Commands
```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Type checking
npm run typecheck

# Linting
npm run lint

# Code formatting
npm run format
```

### Backend Commands
```bash
# Start server
npm start

# Development mode (if nodemon installed)
npm run dev
```

## Project Structure

```
├── backend/           # Express server and API endpoints
├── frontend/          # Vite + TypeScript + D3.js app
├── cli-tool/          # Command-line dependency analyzer
├── example/           # Test project for graph analysis
│   └── example-app/   # Vite/TypeScript sample app
├── docs/              # Documentation and specifications
└── dist/              # Build outputs
```

## Features

- **Interactive Graph Visualization**: Force-directed layout with D3.js
- **Dependency Analysis**: Apps vs libs separation and classification  
- **Performance Modes**: Optimizations for large graphs (>200 nodes)
- **Filtering & Search**: Filter by file types, search nodes, focus modes
- **Statistics Panel**: Most imported/exported files analysis
- **Drill-down Navigation**: Navigate from modules to individual files
- **Export Functionality**: Save graph data and visualizations
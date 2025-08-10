# Dependency Graph Visualizer

Visualizes JavaScript/TypeScript project dependencies as interactive graphs using D3.js.

## Overview

Analyzes internal dependencies in JS/TS repositories, separating apps and libs, and provides drill-down navigation from high-level modules to individual files.

## Quick Start

```bash
# Install dependencies
cd backend
npm install

# Start server
npm start

# Open browser
http://localhost:3000
```

## Usage

```bash
node graph-main.js "./example/example-app/src"
```

## Architecture

- **Backend**: Node.js + Express API server
- **Frontend**: Vite + Typescript + D3.js visualization
- **No build system** - runs directly

## Features

- Dependency graph mapping
- Apps vs libs separation
- Interactive drill-down navigation
- Code size metrics
- Dependency count visualization
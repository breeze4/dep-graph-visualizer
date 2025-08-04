# Dependency Graph Visualizer

A web application for visualizing dependency graphs using vanilla JavaScript and Node.js.

## Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

## Installation

1. Clone the repository
2. Navigate to the backend directory and install dependencies:
   ```bash
   cd backend
   npm install
   ```

## Running the Application

From the backend directory:
```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in the PORT environment variable).

## Project Structure

```
dep-graph-visualizer/
├── backend/          # Node.js server
│   ├── package.json  # Backend dependencies
│   └── server.js     # Express server
├── frontend/         # Vanilla JS webapp
│   ├── index.html    # Main HTML file
│   ├── styles.css    # Styling
│   └── script.js     # Frontend JavaScript
├── docs/             # Documentation
│   └── SPEC.md       # Project specification
├── .gitignore        # Git ignore rules
└── README.md         # This file
```

## Development

- Frontend: Edit files in the `frontend/` directory
- Backend: Modify `backend/server.js` for server changes
- The server automatically serves static files from the frontend directory

## License

MIT
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

## Task 1: Get rid of legacy graph implementation

- [x] Remove legacy format handling from `graph-transformer.ts` (lines 118-160)
- [x] Remove legacy format validation from `file-processor.ts` (validateNodeLegacyFormat function)
- [x] Remove legacy format handling from `stats-ui.ts` (lines 46-60)
- [x] Remove legacy format handling from `filters.ts` (legacy branch logic)
- [x] Update all functions to only handle new spec format (nodes/edges arrays)
- [x] Remove legacy-related type definitions and interfaces
- [x] Test that new spec format still works correctly

## Task 2: Get rid of the legacy graph handling code

- [x] Search for all `data.graph` references and replace with `data.nodes/data.edges`
- [x] Remove `NodeData` interface from graph-transformer.ts (no longer needed for legacy)
- [x] Update `updateTopFilesDisplay` function in stats-ui.ts to remove legacy branch
- [x] Remove legacy format detection logic from file-processor.ts
- [x] Update error messages to only mention new spec format
- [x] Remove legacy format examples from documentation/comments
- [x] Test all graph operations work with new spec format only

## Task 3: Add eslint, prettier, typescript, vite

- [x] Add ESLint devDependency to frontend/package.json
- [x] Create .eslintrc.json config file in frontend/ directory
- [x] Add Prettier devDependency to frontend/package.json  
- [x] Create .prettierrc.json config file in frontend/ directory
- [x] Add ESLint and Prettier scripts to package.json
- [x] Verify TypeScript is already configured (it is: tsconfig.json exists)
- [x] Verify Vite is already configured (it is: vite.config.ts exists)
- [x] Run ESLint on codebase and fix any issues
- [x] Run Prettier on codebase to format all files
- [x] Add lint and format scripts to npm scripts

## Task 4: Fix most imported and most exported panels

- [x] Locate the most imported/exported panel UI elements in stats-ui.ts
- [x] Remove scroll wheel styling and fix container height to use available vertical space
- [x] Replace plain list display with striped table format for better visual hierarchy
- [x] Update CSS for the panels to use flexbox or grid for proper space utilization
- [x] Add alternating row colors (striped) to the import/export tables
- [x] Ensure table headers are properly styled and visible
- [x] Test responsive behavior of the new table layout
- [x] Update hover states and selection for table rows

## Task 5: Fix graph rendering log that keeps growing

- [ ] Locate the `console.log('Graph rendering completed...')` in graph-renderer.ts:448
- [ ] Identify why the tick count keeps growing (likely simulation not being properly reset)
- [ ] Add proper cleanup of previous simulation before creating new one
- [ ] Reset tick counter to 0 when starting a new rendering cycle
- [ ] Ensure simulation.stop() is called on old simulations
- [ ] Add simulation state management to prevent multiple concurrent simulations
- [ ] Test that the rendering time and tick count reset properly between renders

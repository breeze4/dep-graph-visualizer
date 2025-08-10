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

# UI Fix Tasks

## **Section 14: Arrow and Edge Rendering Fixes**

### Task 14.1: Investigate current arrow rendering implementation
- [ ] Examine D3 graph code to understand current arrow/marker implementation
- [ ] Identify where arrows are defined and attached to edges
- [ ] Document current arrow styling and positioning approach

### Task 14.2: Fix arrow marker positioning
- [ ] Ensure arrow markers are properly positioned at edge endpoints
- [ ] Remove any visual gap between edge line and arrow tip
- [ ] Adjust marker positioning calculations if needed

### Task 14.3: Standardize arrow styling
- [ ] Ensure arrowheads use consistent stroke and fill properties with their parent edges
- [ ] Make arrow color and thickness match the edge they belong to
- [ ] Remove any styling inconsistencies between edges and arrows

### Task 14.4: Test arrow rendering across zoom levels
- [ ] Verify arrows remain properly positioned during zoom operations
- [ ] Test arrow visibility and cohesion at different zoom levels
- [ ] Ensure arrows scale appropriately with their edges

### Task 14.5: Verify animation compatibility
- [ ] Test that arrows remain visually cohesive during graph animations
- [ ] Ensure arrows follow their edges properly during force simulation updates
- [ ] Fix any animation artifacts affecting arrow rendering

---

## **Section 15: Import/Export Panels UI Improvements**

### Task 15.1: Analyze current panel layout
- [ ] Examine existing import/export panel HTML structure and CSS
- [ ] Identify sources of unnecessary scrollbars and limited height usage
- [ ] Document current layout approach and constraints

### Task 15.2: Remove unnecessary scrollbars
- [ ] Eliminate scrollbars from panels that should use full available space
- [ ] Adjust CSS overflow properties appropriately
- [ ] Ensure content fits naturally within panel boundaries

### Task 15.3: Implement proper vertical space utilization
- [ ] Update panel layout to use full available vertical space
- [ ] Implement flex or grid layout for responsive panel sizing
- [ ] Ensure panels expand to fill their container height

### Task 15.4: Add striped table styling
- [ ] Convert import/export row display to striped table format
- [ ] Add alternating row background colors for better readability
- [ ] Ensure proper table styling with consistent spacing and alignment

### Task 15.5: Implement responsive panel sizing
- [ ] Make panels respond to container height changes
- [ ] Ensure proper sizing across different screen sizes
- [ ] Test panel behavior when resizing the application window

### Task 15.6: Test with varying data amounts
- [ ] Verify panel behavior with small amounts of import/export data
- [ ] Test with large amounts of data to ensure proper handling
- [ ] Confirm no unnecessary scrolling for reasonable data amounts

---

## **Section 16: Graph Rendering Performance Logging**

### Task 16.1: Locate existing render performance code
- [ ] Find the current render time logging implementation
- [ ] Identify where tick count and render time are measured and logged
- [ ] Document the current performance tracking approach

### Task 16.2: Fix tick count accumulation
- [ ] Reset tick count to zero at the start of each new render cycle
- [ ] Ensure tick count doesn't carry over from previous renders
- [ ] Verify tick count accurately reflects only the current render

### Task 16.3: Fix render time measurement reset
- [ ] Ensure render time measurement starts fresh for each render
- [ ] Reset performance timers at the beginning of each render cycle
- [ ] Verify render time reflects only the current render duration

### Task 16.4: Add proper cleanup for new graph loads
- [ ] Clear all performance metrics when loading a new graph
- [ ] Reset counters and timers when graph data changes
- [ ] Ensure clean state for performance tracking on new data

### Task 16.5: Verify accurate per-render statistics
- [ ] Test that logging shows correct statistics for individual renders
- [ ] Confirm no accumulation or carryover between separate renders
- [ ] Validate performance metrics match actual render behavior

---

## **Section 17: Multi-Select Mode UX Enhancements**

### Task 17.1: Identify purple modal flashing issue
- [ ] Locate code responsible for purple modal during shift key hold
- [ ] Understand what triggers the modal to appear/flash
- [ ] Document the current multi-select mode implementation

### Task 17.2: Fix modal flashing behavior
- [ ] Remove unwanted modal flashing when shift key is held
- [ ] Either eliminate the modal or fix its timing/trigger logic
- [ ] Ensure smooth multi-select mode activation without visual glitches

### Task 17.3: Add visual selection indicators to nodes
- [ ] Implement clear visual indicators for selected nodes (border, highlight, etc.)
- [ ] Ensure selected nodes are easily distinguishable from unselected ones
- [ ] Make selection indicators visible across different node types and colors

### Task 17.4: Distinguish target vs comparison selections
- [ ] Visually differentiate the first selected node (target) from additional selections
- [ ] Use different visual treatments for target node vs comparison nodes
- [ ] Make the selection hierarchy clear to users

### Task 17.5: Add selection state feedback
- [ ] Provide clear visual feedback about current selection mode and state
- [ ] Show users when they're in multi-select mode
- [ ] Display information about what the selections will be used for

### Task 17.6: Test multi-select workflow usability
- [ ] Verify the complete multi-select workflow is intuitive and clear
- [ ] Test that users can understand the selection purpose and process
- [ ] Ensure all visual indicators work correctly across the workflow

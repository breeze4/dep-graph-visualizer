Here’s a **merged and expanded spec** that integrates your existing SPEC with the new ideas you described earlier — it’s now a full end-to-end blueprint for building the dependency graph visualizer, including **features**, **workflows**, **UI behaviors**, **graph representation details**, and **technical implementation notes**.

---

# Dependency Graph Visualizer – Full Specification

## **1. Project Overview**

A tool for exploring, analyzing, and refactoring large Angular (or general TypeScript) monorepos by visualizing the dependency graph between modules, directories, and files.
The goal is to:

* Identify **tightly coupled** and **loosely coupled** areas.
* See **incoming** and **outgoing** dependencies.
* Explore dependencies smoothly at multiple levels.
* Extract potential **minimal interfaces** for sets of modules.
* Provide deep links to files in IDE or GitHub.

During development:
* Use an example app in the same directory structure: `./example/example-app/src` contains an apps and libs directory structure that roughly resembles the type of codebase that will be analyzed.

---

## **2. Architecture**

### **Backend (Node.js + Express)**

* Serves static frontend files.
* Provides an API to:

  * Generate dependency graphs from a local codebase.
  * Return JSON graph data for visualization.
* Uses **TypeScript compiler API** or **ts-morph** to parse `.ts` files and extract imports.
* Configurable port (default `3000`).
* Can run in:

  * **Static mode** – serves pre-generated JSON graphs.
  * **Live analysis mode** – scans the codebase on request.

### **Frontend (Vanilla JS + D3.js)**

* Renders an interactive graph.
* Supports **multi-level zoom** and **focus modes**.
* Displays detail panels for nodes and edges.
* Allows selection and grouping for **interface extraction**.
* Entry point: `index.html`.

---

## **3. Data Model**

### **Graph Representation**

* Directed graph with explicit forward (`imports`) and reverse (`importedBy`) edges.
* Supports both **file-level** and **module-level** aggregation.

```json
{
  "metadata": {
    "generatedAt": "2025-08-09T12:00:00Z",
    "projectRoot": "/path/to/repo",
    "stats": {
      "totalFiles": 0,
      "apps": 0,
      "libs": 0
    }
  },
  "nodes": [
    {
      "id": "libs/util",
      "type": "lib",
      "linesOfCode": 450,
      "fileCount": 12,
      "incomingCount": 8,
      "outgoingCount": 3
    }
  ],
  "edges": [
    {
      "from": "apps/dashboard",
      "to": "libs/util",
      "count": 5,
      "symbols": ["formatDate", "parseDate"]
    }
  ]
}
```

**Node Attributes:**

* `id`: unique path or module identifier.
* `type`: `"app" | "lib" | "external"`.
* `linesOfCode`: sum of code lines in this node.
* `fileCount`: number of files in this node.
* `incomingCount`: number of unique modules that depend on it.
* `outgoingCount`: number of unique modules it depends on.

**Edge Attributes:**

* `from` / `to`: node IDs.
* `count`: number of distinct importing files.
* `symbols`: array of imported identifiers.

---

## **4. Graph Generation Process**

1. **Codebase traversal**

   * Scan specific app directory within `apps/` and the entire `libs/` directories recursively.
   * Group files into **modules** by directory/package.json or Angular NgModule boundary.

2. **Dependency extraction**

   * Parse imports with `ts-morph`.
   * Ignore test files (configurable).
   * Map imports to absolute project paths.
   * Aggregate identical `from→to` imports into a single edge with a count.

3. **Stats collection**

   * Lines of code.
   * Incoming/outgoing dependency counts.
   * 3rd party package usage.

4. **Output**

   * Save to `.json` for visualization.

---

## **5. User Workflows**

### **5.1 Load & Explore Graph**

1. Drag & drop JSON into the app. During development it should auto-load a fixed reference to a created JSON file, so that its easier to refresh the page and see updates.
2. Graph renders with the app and libs as root-level clusters.
3. Pan, zoom, and select nodes to explore.

### **5.2 Drill-down Navigation**

* **Zoom**:

  * Scrollwheel = zoom in/out.
  * Click a node = focus mode.
  * Focus mode shows node + its immediate incoming/outgoing neighbors.
  * [future] “Go one level deeper” button to reveal neighbors’ neighbors.
* **Collapse/expand**:

  * Collapse subtrees to declutter.
  * Expand back on demand.

### **5.3 Dependency Analysis**

* Click node → side panel shows:

  * What imports it.
  * What it imports.
  * Counts grouped by import path.
  * [future] Deep link to source (`vscode://` or GitHub).
* Click edge → panel shows:

  * Importing files.
  * Imported symbols.
  * Counts.

### **5.4 Interface Extraction**

1. Select an **importer** node.
2. Multi-select **imported** nodes (shift-click).
3. Tool aggregates their exported members:

   * Intersection set (shared).
   * Union set (full list).
4. Option to copy interface suggestion or [future] send to LLM for refinement.

---

## **6. UI & Interaction**

### **Graph View**

* **Node size** = incoming dependency count.
* **Node color**:

  * App = blue
  * Lib = green
  * External = gray
* **Edge thickness** = number of unique importers.
* Hover node/edge → show tooltip with summary.
* Smooth zoom/pan transitions.
* Lazy-load rendering for large graphs.

### **Information Panel**

* Always visible on right side.
* Tabs:

  * **Node details**
  * **Edge details**
  * **Interface extraction**
* Search bar for filtering.

### **Controls**

* Toggle incoming/outgoing edges.
* Filter by dependency count, node type.
* Reset graph layout.

---

## **7. Technical Implementation (D3)**

### **Force Layout**

* Force simulation graph
* Collision detection to prevent overlaps.
* Zoom with `d3.zoom()`.

### **Representing Relative dependency strength***

#### Edge Representation

* **Direction**: Arrows point from the importing file to the imported file (A → B means A imports B).
* **Thickness Scaling**:

  * The `stroke-width` of the line is proportional to the *dependency strength*.
  * **Dependency strength** = number of distinct symbols imported or frequency of imports between two files (configurable metric).
  * Thicker lines indicate stronger/more significant dependencies.
  * Minimum thickness (light weight) for weak dependencies to keep them visible without overpowering the graph.
* **Color**: Subtle neutral tone (e.g., gray) to keep focus on nodes; arrowheads slightly darker for visibility.

#### Example Scaling Rule

```js
const maxStrength = d3.max(edges, e => e.strength);
const thicknessScale = d3.scaleLinear()
  .domain([1, maxStrength])
  .range([1, 6]); // px stroke width
```

Applied in the edge rendering:

```js
edgeSelection
  .attr("stroke-width", d => thicknessScale(d.strength));
```

#### Visual Result

* Strong dependencies are visually prominent (bold, thick lines).
* Weak dependencies fade into the background but remain visible for context.
* Node positions are determined purely by the force simulation, not by dependency strength — preventing distortions in layout.

### **Performance**

* For >500 nodes, use WebGL-based rendering (`d3-force-3d` + `PixiJS`).
* Virtualize side panel lists for large datasets.

---

## **8. Future Extensions**

* 3rd party dependency map.
* “What if I change this module?” breakage prediction.
* Save/load selection states.
* Auto-generate LLM prompts for interface design.

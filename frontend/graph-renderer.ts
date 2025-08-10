/**
 * D3 Visualization and Rendering Module
 * Handles D3 setup, force simulation, and graph rendering
 */
import * as d3 from 'd3';

import { transformGraphData, calculateEdgeWeight, GraphNode } from './graph-transformer.ts';
import { getDimensions } from './dom-setup.ts';
import { deselectAllNodes } from './interaction-handlers.ts';
import { SimulationNodeDatum, SimulationLinkDatum } from 'd3';

// Extended interfaces for D3 simulation with our custom properties
interface SimulationNode extends SimulationNodeDatum, GraphNode {}

// D3 visualization variables
let svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
let g: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
let zoom: d3.ZoomBehavior<SVGSVGElement, unknown>;
let currentSimulation: d3.Simulation<SimulationNode, undefined>;
let nodes: SimulationNode[];
let links: any[];
let performanceMode = false; // Enable optimizations for large graphs
let nodeVirtualization = false; // Enable node virtualization

/**
 * Initialize D3 visualization
 */
function initializeD3Visualization(currentGraphData) {
  const visualization = document.getElementById('visualization');
  visualization.innerHTML = '';

  // Get full window dimensions
  const { width, height } = getDimensions();

  // Create SVG with D3
  svg = d3
    .select('#visualization')
    .append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('viewBox', `0 0 ${width} ${height}`);

  // Create zoom behavior
  zoom = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.1, 4])
    .on('zoom', function (event) {
      g.attr('transform', event.transform);
    });

  // Apply zoom to SVG
  svg.call(zoom);

  // Create main group for all graph elements
  g = svg.append('g').attr('class', 'graph-container');

  // Add background rectangle for zoom/pan events and deselection
  g.append('rect')
    .attr('width', width)
    .attr('height', height)
    .attr('fill', 'transparent')
    .attr('pointer-events', 'all')
    .on('click', function (event) {
      // Deselect nodes when clicking empty space
      event.stopPropagation();
      deselectAllNodes();
    });

  // Transform graph data and render
  if (currentGraphData) {
    const graphData = transformGraphData(currentGraphData);
    renderGraph(graphData, null, null, null, null, null, null);
  }

  return { svg, g, zoom, currentSimulation };
}

/**
 * Render the graph with D3
 */
function renderGraph(
  graphData,
  dragHandlers,
  nodeClickHandler,
  nodeHoverHandlers,
  edgeHandlers,
  showLinkTooltip,
  hideLinkTooltip
) {
  // Stop and cleanup previous simulation to prevent tick count accumulation
  if (currentSimulation) {
    currentSimulation.stop();
    currentSimulation = null;
  }

  console.log(
    `Rendering graph with ${graphData.nodes.length} nodes and ${graphData.links.length} edges`
  );

  nodes = graphData.nodes;
  links = graphData.links;

  // Determine if we need performance optimizations
  const nodeCount = nodes.length;
  const edgeCount = links.length;
  performanceMode = nodeCount > 200 || edgeCount > 500;
  nodeVirtualization = nodeCount > 500;

  if (performanceMode) {
    console.log('Enabling performance mode for large graph');
    showPerformanceIndicator(`Performance mode enabled (${nodeCount} nodes, ${edgeCount} edges)`);
  }
  if (nodeVirtualization) {
    console.log('Enabling node virtualization for very large graph');
    showPerformanceIndicator(`Virtualization enabled (${nodeCount} nodes)`);
  }

  // Clear existing elements
  g.selectAll('.link').remove();
  g.selectAll('.node').remove();

  // Clear existing defs and add new ones
  svg.selectAll('defs').remove();
  const defs = svg.append('defs');

  // Add arrowhead markers
  addArrowMarkers(defs);

  // Create links (edges) with enhanced styling
  const link = createLinks(g, links, showLinkTooltip, hideLinkTooltip);

  // Create invisible wider click areas for easier edge clicking
  const linkClickArea = createLinkClickAreas(g, links, edgeHandlers);

  // Create nodes (circles)
  const node = createNodes(g, nodes, nodeClickHandler, nodeHoverHandlers, dragHandlers);

  // Initialize force simulation
  currentSimulation = createForceSimulation(nodes, links, nodeCount, edgeCount);

  // Update positions on each tick
  setupSimulationTick(currentSimulation, link, linkClickArea, node);

  return { currentSimulation };
}

/**
 * Add arrow markers to SVG defs
 */
function addArrowMarkers(defs) {
  // Create dynamic markers for different node sizes
  // Generate markers for node sizes from 8 to 50 (matching the size range in graph-transformer)
  for (let size = 8; size <= 50; size += 2) {
    const markerSize = Math.max(4, Math.min(8, size * 0.15)); // Scale marker size with node
    const refX = size + 10; // Position arrow at node edge + marker length

    defs
      .append('marker')
      .attr('id', `arrowhead-${size}`)
      .attr('viewBox', '-1 -5 12 10') // Extended viewBox for better centering
      .attr('refX', refX)
      .attr('refY', 0)
      .attr('markerWidth', markerSize)
      .attr('markerHeight', markerSize)
      .attr('orient', 'auto-start-reverse') // Better orientation handling
      .append('path')
      .attr('d', 'M0,-4L8,0L0,4L2,0Z') // More precise arrow shape with sharper point
      .attr('fill', '#99a');
  }

  // Keep fallback markers for backward compatibility
  defs
    .append('marker')
    .attr('id', 'arrowhead-small')
    .attr('viewBox', '-1 -5 12 10')
    .attr('refX', 18) // For size 8 nodes
    .attr('refY', 0)
    .attr('markerWidth', 4)
    .attr('markerHeight', 4)
    .attr('orient', 'auto-start-reverse')
    .append('path')
    .attr('d', 'M0,-4L8,0L0,4L2,0Z')
    .attr('fill', '#99a');

  defs
    .append('marker')
    .attr('id', 'arrowhead')
    .attr('viewBox', '-1 -5 12 10')
    .attr('refX', 35) // For average size nodes
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto-start-reverse')
    .append('path')
    .attr('d', 'M0,-4L8,0L0,4L2,0Z')
    .attr('fill', '#99a');

  defs
    .append('marker')
    .attr('id', 'arrowhead-large')
    .attr('viewBox', '-1 -5 12 10')
    .attr('refX', 60) // For large size nodes
    .attr('refY', 0)
    .attr('markerWidth', 8)
    .attr('markerHeight', 8)
    .attr('orient', 'auto-start-reverse')
    .append('path')
    .attr('d', 'M0,-4L8,0L0,4L2,0Z')
    .attr('fill', '#99a');
}

/**
 * Create links (edges)
 */
function createLinks(g, links, showLinkTooltip, hideLinkTooltip) {
  return g
    .append('g')
    .attr('class', 'links')
    .selectAll('.link')
    .data(links)
    .enter()
    .append('path')
    .attr('class', d => {
      // Add class based on connection type
      const sourceType = d.source.isApp ? 'app' : d.source.isLib ? 'lib' : 'other';
      const targetType = d.target.isApp ? 'app' : d.target.isLib ? 'lib' : 'other';
      return `link link-${sourceType}-to-${targetType}`;
    })
    .attr('stroke', d => {
      // Set stroke color based on connection type - darker colors for better visibility
      if (d.source.isApp && d.target.isApp) return '#5577aa';
      if (d.source.isLib && d.target.isLib) return '#55aa77';
      if (d.source.isApp && d.target.isLib) return '#6688aa';
      if (d.source.isLib && d.target.isApp) return '#66aa88';
      return '#666';
    })
    .attr('stroke-opacity', 0.7) // Increased for better visibility
    .attr('stroke-width', d => {
      // Use thickness based on dependency strength (count) if available
      return d.thickness || calculateEdgeWeight(d);
    })
    .attr('fill', 'none')
    .attr('marker-end', d => {
      // Select marker based on target node size for perfect alignment
      const targetSize = d.target.size || 20;

      // Round to nearest even number that we created markers for
      const roundedSize = Math.round(targetSize / 2) * 2;
      const clampedSize = Math.max(8, Math.min(50, roundedSize));

      return `url(#arrowhead-${clampedSize})`;
    })
    .on('mouseenter', function (event, d) {
      // Highlight edge on hover (CSS handles color change)
      d3.select(this)
        .attr('stroke-opacity', 0.9)
        .attr('stroke-width', Math.max(3, (d.thickness || calculateEdgeWeight(d)) * 1.5));

      // Show tooltip
      if (showLinkTooltip) showLinkTooltip(event, d);
    })
    .on('mouseleave', function (event, d) {
      // Reset edge styling with correct color
      let strokeColor = '#666';
      if (d.source.isApp && d.target.isApp) strokeColor = '#5577aa';
      else if (d.source.isLib && d.target.isLib) strokeColor = '#55aa77';
      else if (d.source.isApp && d.target.isLib) strokeColor = '#6688aa';
      else if (d.source.isLib && d.target.isApp) strokeColor = '#66aa88';

      d3.select(this)
        .attr('stroke', strokeColor)
        .attr('stroke-opacity', 0.7)
        .attr('stroke-width', calculateEdgeWeight(d));

      // Hide tooltip
      if (hideLinkTooltip) hideLinkTooltip();
    });
}

/**
 * Create invisible click areas for edges
 */
function createLinkClickAreas(g, links, edgeHandlers) {
  return g
    .append('g')
    .attr('class', 'link-click-areas')
    .selectAll('.link-click-area')
    .data(links)
    .enter()
    .append('path')
    .attr('class', 'link-click-area')
    .attr('stroke', 'transparent')
    .attr('stroke-width', 12) // Much wider for easier clicking
    .attr('fill', 'none')
    .style('cursor', 'pointer')
    .on('click', function (event, d) {
      event.stopPropagation();
      if (edgeHandlers && edgeHandlers.selectEdge) {
        edgeHandlers.selectEdge(d);
      }
    })
    .on('mouseenter', function (event, d) {
      // Forward hover events to the visible edge
      const visibleEdge = g.selectAll('.link').filter(linkData => linkData === d);
      visibleEdge.dispatch('mouseenter', { detail: event });
    })
    .on('mouseleave', function (event, d) {
      // Forward hover events to the visible edge
      const visibleEdge = g.selectAll('.link').filter(linkData => linkData === d);
      visibleEdge.dispatch('mouseleave', { detail: event });
    });
}

/**
 * Create nodes
 */
function createNodes(g, nodes, nodeClickHandler, nodeHoverHandlers, dragHandlers) {
  const node = g
    .append('g')
    .attr('class', 'nodes')
    .selectAll('.node')
    .data(nodes)
    .enter()
    .append('g')
    .attr('class', 'node');

  // Add circles to nodes
  node
    .append('circle')
    .attr('r', d => d.size)
    .attr('fill', d => d.color)
    .attr('stroke', '#fff')
    .attr('stroke-width', 2)
    .style('cursor', 'pointer');

  // Add labels to nodes with performance optimization
  if (!nodeVirtualization) {
    node
      .append('text')
      .text(d => {
        if (performanceMode) {
          // Show fewer labels in performance mode
          return d.incomingCount > 2 ? d.name.substring(0, 8) + '..' : '';
        }
        // Truncate long names based on node size
        const maxLength = Math.max(8, Math.min(15, d.size / 3));
        return d.name.length > maxLength ? d.name.substring(0, maxLength - 2) + '..' : d.name;
      })
      .attr('dy', d => (d.size > 25 ? '0.35em' : `${d.size + 12}px`)) // Position based on node size
      .attr('text-anchor', 'middle')
      .attr('font-family', 'Segoe UI, sans-serif')
      .attr('font-size', d => `${Math.max(9, Math.min(12, d.size / 4))}px`) // Dynamic font size
      .attr('fill', d => (d.size > 25 ? '#fff' : '#333')) // White text for large nodes
      .attr('font-weight', d => (d.size > 30 ? 'bold' : 'normal'))
      .attr('pointer-events', 'none')
      .attr('class', 'node-label');
  } else {
    console.log('Skipping node labels for virtualization performance');
  }

  // Add drag functionality if provided
  if (dragHandlers) {
    node.call(
      d3
        .drag()
        .on('start', dragHandlers.dragstarted)
        .on('drag', dragHandlers.dragged)
        .on('end', dragHandlers.dragended)
    );
  }

  // Add click and hover functionality for nodes
  if (nodeClickHandler) {
    node.on('click', nodeClickHandler);
  }

  if (nodeHoverHandlers) {
    node
      .on('mouseenter', nodeHoverHandlers.mouseenter)
      .on('mouseleave', nodeHoverHandlers.mouseleave);
  }

  return node;
}

/**
 * Create force simulation
 */
function createForceSimulation(nodes, links, nodeCount, edgeCount) {
  const { width, height } = getDimensions();

  // Initialize force simulation with performance-optimized parameters
  const linkStrength = performanceMode ? 0.1 : 0.3;
  const chargeStrength = performanceMode ? -100 : -200;
  const alphaDecay = performanceMode ? 0.05 : 0.02;
  const velocityDecay = performanceMode ? 0.4 : 0.3;

  return d3
    .forceSimulation(nodes as SimulationNode[])
    .force(
      'link',
      d3
        .forceLink(links)
        .id(d => (d as SimulationNode).id)
        .distance(d => {
          if (performanceMode) {
            // Simplified distance calculation for performance
            return 50;
          }
          // Adjust distance based on node sizes
          const sourceSize = (d.source as SimulationNode).size || 20;
          const targetSize = (d.target as SimulationNode).size || 20;
          return Math.max(80, (sourceSize + targetSize) * 1.5);
        })
        .strength(linkStrength)
    )
    .force(
      'charge',
      d3
        .forceManyBody()
        .strength(d => {
          if (performanceMode) {
            // Simplified charge for performance
            return chargeStrength;
          }
          // Stronger repulsion for larger nodes
          return chargeStrength - (d as SimulationNode).size * 5;
        })
        .distanceMax(performanceMode ? 200 : 300)
    )
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force(
      'collision',
      d3
        .forceCollide()
        .radius(d => (d as SimulationNode).size + (performanceMode ? 4 : 8))
        .strength(performanceMode ? 0.5 : 0.8)
    )
    .force('x', d3.forceX(width / 2).strength(0.05))
    .force('y', d3.forceY(width / 2).strength(0.05))
    .alphaDecay(alphaDecay)
    .velocityDecay(velocityDecay);
}

/**
 * Setup simulation tick handler
 */
function setupSimulationTick(simulation, link, linkClickArea, node) {
  // Reset tick counter for this render cycle only
  let tickCount = 0;
  // Track simulation start time when first tick begins
  let simulationStartTime = null;

  simulation.on('tick', () => {
    if (simulationStartTime === null) {
      simulationStartTime = performance.now();
    }
    tickCount++;

    if (performanceMode) {
      // Use straight lines for better performance in large graphs
      link.attr('d', d => `M${d.source.x},${d.source.y}L${d.target.x},${d.target.y}`);
      linkClickArea.attr('d', d => `M${d.source.x},${d.source.y}L${d.target.x},${d.target.y}`);
    } else {
      // Use curved paths for better visual appeal in smaller graphs
      const pathGenerator = d => {
        const dx = d.target.x - d.source.x;
        const dy = d.target.y - d.source.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Reduce curve factor to minimize arrow angle offset
        const dr = distance * 0.15; // Reduced from 0.3 to 0.15 for better arrow alignment

        // Calculate curve direction to avoid overlaps
        const sourceIndex = nodes.findIndex(n => n.id === d.source.id);
        const targetIndex = nodes.findIndex(n => n.id === d.target.id);
        const sweep = sourceIndex < targetIndex ? 0 : 1;

        // For very short distances, use straight lines to avoid angle issues
        if (distance < 80) {
          return `M${d.source.x},${d.source.y}L${d.target.x},${d.target.y}`;
        }

        return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,${sweep} ${d.target.x},${d.target.y}`;
      };

      // Update visible links
      link.attr('d', pathGenerator);

      // Update invisible click areas with same path
      linkClickArea.attr('d', pathGenerator);
    }

    node.attr('transform', d => `translate(${d.x},${d.y})`);
  });

  // Handle label collisions after simulation stabilizes
  simulation.on('end', () => {
    const simulationEndTime = performance.now();
    const simulationTime = simulationStartTime ? simulationEndTime - simulationStartTime : 0;
    console.log(`Graph simulation completed in ${simulationTime.toFixed(2)}ms with ${tickCount} ticks`);
    simulationStartTime = null;
    tickCount = 0; 

    setTimeout(() => {
      if (!performanceMode) {
        handleLabelCollisions();
      } else {
        console.log('Skipping label collision detection for performance');
      }
    }, 100);
  });
}

/**
 * Label collision detection (basic implementation)
 */
function handleLabelCollisions() {
  if (!g) return;

  const labels = g.selectAll('.node-label').nodes();
  const labelData = labels.map(label => {
    const bbox = (label as SVGTextElement).getBBox();
    const transform = d3.select((label as Element).parentNode as Element).attr('transform');
    const translate = transform ? transform.match(/translate\(([^,]+),([^)]+)\)/) : null;

    return {
      element: label,
      x: translate ? parseFloat(translate[1]) - bbox.width / 2 : 0,
      y: translate ? parseFloat(translate[2]) - bbox.height / 2 : 0,
      width: bbox.width,
      height: bbox.height,
    };
  });

  // Simple collision detection - hide overlapping labels
  for (let i = 0; i < labelData.length; i++) {
    let hasCollision = false;
    for (let j = i + 1; j < labelData.length; j++) {
      const a = labelData[i];
      const b = labelData[j];

      if (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
      ) {
        hasCollision = true;
        break;
      }
    }

    // Hide labels that would collide (keep larger nodes visible)
    const parentNode = d3.select((labelData[i].element as Element).parentNode as Element);
    const nodeSize = (parentNode.datum() as SimulationNode).size;

    if (hasCollision && nodeSize < 20) {
      d3.select(labelData[i].element).style('display', 'none');
    }
  }
}

/**
 * Show performance indicator
 */
function showPerformanceIndicator(message) {
  // Remove any existing indicator
  const existing = document.querySelector('.performance-indicator');
  if (existing) existing.remove();

  // Create new indicator
  const indicator = document.createElement('div');
  indicator.className = 'performance-indicator';
  indicator.innerHTML = `
        <span class="perf-icon">⚡</span>
        <span class="perf-text">${message}</span>
    `;
  document.body.appendChild(indicator);

  // Auto-hide after 5 seconds
  setTimeout(() => {
    if (indicator.parentNode) {
      indicator.remove();
    }
  }, 5000);
}

/**
 * Reset graph view function
 */
function resetGraphView(svg, zoom, g) {
  if (svg && zoom) {
    svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
  }

  // Clear selection with smooth transition
  g.selectAll('.node circle')
    .transition()
    .duration(300)
    .ease(d3.easeQuadOut)
    .attr('stroke', '#fff')
    .attr('stroke-width', 2)
    .attr('opacity', 1);

  // Reset edge selection
  g.selectAll('.link')
    .transition()
    .duration(300)
    .ease(d3.easeQuadOut)
    .attr('stroke-opacity', 0.7)
    .attr('stroke-width', d => d.thickness || calculateEdgeWeight(d));
}

// Getter functions for module state
const getCurrentSimulation = () => currentSimulation;
const getSvg = () => svg;
const getG = () => g;
const getZoom = () => zoom;
const getNodes = () => nodes;
const getLinks = () => links;

export {
  initializeD3Visualization,
  renderGraph,
  resetGraphView,
  handleLabelCollisions,
  showPerformanceIndicator,

  // Getters for module state
  getCurrentSimulation,
  getSvg,
  getG,
  getZoom,
  getNodes,
  getLinks,
};

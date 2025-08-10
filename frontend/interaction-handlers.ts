/**
 * Node and Edge Interaction Handlers Module
 * Handles node selection, edge selection, drag functionality, and hover effects
 */
import * as d3 from 'd3';

import { getG, getNodes, getLinks } from './graph-renderer.ts';
import { calculateEdgeWeight } from './graph-transformer.ts';

/**
 * Select a node and update the info panel
 */
function selectNode(nodeData, focusMode, focusedNode) {
    // Update info panel with node details
    const fileInfo = document.getElementById('file-info');
    fileInfo.innerHTML = `
        <div class="node-details">
            <h4>${nodeData.name}</h4>
            <p><strong>Path:</strong> ${nodeData.path}</p>
            <p><strong>Lines of Code:</strong> ${nodeData.linesOfCode}</p>
            <p><strong>File Count:</strong> ${nodeData.fileCount || 1}</p>
            <p><strong>Type:</strong> ${nodeData.type ? (nodeData.type === 'app' ? 'App' : nodeData.type === 'lib' ? 'Library' : 'External') : (nodeData.isApp ? 'App' : 'Library')}</p>
            <p><strong>Imports:</strong> ${nodeData.imports.length} files</p>
            <p><strong>Imported By:</strong> ${nodeData.importedBy.length} files</p>
        </div>
        
        <div class="dependencies">
            <h5>Imports:</h5>
            <ul class="dependency-list">
                ${nodeData.imports.map(imp => `<li>${imp}</li>`).join('')}
            </ul>
            
            <h5>Imported By:</h5>
            <ul class="dependency-list">
                ${nodeData.importedBy.map(imp => `<li>${imp}</li>`).join('')}
            </ul>
        </div>
        
        <div class="focus-controls">
            <button class="focus-btn" onclick="toggleFocusMode('${nodeData.id}')">
                ${focusMode && focusedNode === nodeData.id ? 'Exit Focus' : 'Focus Mode'}
            </button>
        </div>
    `;
    
    const g = getG();
    const selectedNodes = new Set();
    
    // Highlight selected node with smooth transitions
    if (selectedNodes.size === 0) {
        // Single selection mode
        g.selectAll('.node circle')
            .transition()
            .duration(300)
            .ease(d3.easeQuadOut)
            .attr('stroke', '#fff')
            .attr('stroke-width', 2);
        
        g.selectAll('.node')
            .filter(d => d.id === nodeData.id)
            .select('circle')
            .transition()
            .duration(300)
            .ease(d3.easeQuadOut)
            .attr('stroke', '#e74c3c')
            .attr('stroke-width', 4);
    }
}

/**
 * Select an edge and update the info panel
 */
function selectEdge(edgeData, performanceMode, isPathHighlighted, connectionFocusMode, focusedConnection) {
    // Lazy loading: compute expensive details only when edge is selected
    const startTime = performance.now();
    
    // Update info panel with edge details
    const fileInfo = document.getElementById('file-info');
    const sourceName = edgeData.source.name || edgeData.source.id.split('/').pop();
    const targetName = edgeData.target.name || edgeData.target.id.split('/').pop();
    
    // Show basic info immediately, load symbols lazily if needed
    const basicInfo = `
        <div class="edge-details">
            <h4>Dependency Connection</h4>
            <p><strong>From:</strong> ${sourceName}</p>
            <p class="path-detail">${edgeData.source.path}</p>
            <p><strong>To:</strong> ${targetName}</p>
            <p class="path-detail">${edgeData.target.path}</p>
            <p><strong>Import Count:</strong> ${edgeData.count || 1}</p>
            <div id="symbols-container">
                ${performanceMode ? 
                    '<p><em>Symbol details disabled in performance mode</em></p>' :
                    edgeData.symbols && edgeData.symbols.length > 0 ? `
                        <p><strong>Imported Symbols:</strong></p>
                        <ul class="symbols-list">
                            ${edgeData.symbols.slice(0, 20).map(symbol => `<li>${symbol}</li>`).join('')}
                            ${edgeData.symbols.length > 20 ? `<li><em>... and ${edgeData.symbols.length - 20} more</em></li>` : ''}
                        </ul>
                    ` : '<p><em>No symbol information available</em></p>'
                }
            </div>
        </div>
        
        <div class="edge-actions">
            <button class="action-btn" id="highlight-btn" data-source="${edgeData.source.id}" data-target="${edgeData.target.id}" onclick="toggleHighlightPath('${edgeData.source.id}', '${edgeData.target.id}')">
                ${isPathHighlighted(edgeData.source.id, edgeData.target.id) ? 'Clear Highlight' : 'Highlight Path'}
            </button>
            <button class="action-btn" id="focus-btn" data-source="${edgeData.source.id}" data-target="${edgeData.target.id}" onclick="toggleConnectionFocus('${edgeData.source.id}', '${edgeData.target.id}')">
                ${connectionFocusMode && focusedConnection === `${edgeData.source.id}-${edgeData.target.id}` ? 'Exit Focus' : 'Focus Connection'}
            </button>
        </div>
    `;
    
    fileInfo.innerHTML = basicInfo;
    
    const endTime = performance.now();
    if (performanceMode) {
        console.log(`Edge selection rendered in ${(endTime - startTime).toFixed(2)}ms`);
    }
    
    const g = getG();
    
    // Highlight the selected edge
    g.selectAll('.link')
        .transition()
        .duration(300)
        .ease(d3.easeQuadOut)
        .attr('stroke-opacity', d => d === edgeData ? 0.9 : 0.3)
        .attr('stroke-width', d => d === edgeData ? Math.max(4, (d.thickness || calculateEdgeWeight(d)) * 1.8) : (d.thickness || calculateEdgeWeight(d)));
    
    // Highlight connected nodes
    g.selectAll('.node circle')
        .transition()
        .duration(300)
        .ease(d3.easeQuadOut)
        .attr('stroke', d => (d.id === edgeData.source.id || d.id === edgeData.target.id) ? '#e74c3c' : '#fff')
        .attr('stroke-width', d => (d.id === edgeData.source.id || d.id === edgeData.target.id) ? 4 : 2)
        .attr('opacity', d => (d.id === edgeData.source.id || d.id === edgeData.target.id) ? 1 : 0.6);
}

/**
 * Create drag handlers for nodes
 */
function createDragHandlers(currentSimulation) {
    function dragstarted(event, d) {
        if (!event.active) currentSimulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }
    
    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }
    
    function dragended(event, d) {
        if (!event.active) currentSimulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
    
    return { dragstarted, dragged, dragended };
}

/**
 * Create node click handler
 */
function createNodeClickHandler(multiSelectMode, toggleNodeSelection, clearMultiSelection, selectNode) {
    return function(event, d) {
        event.stopPropagation();
        
        if (multiSelectMode) {
            toggleNodeSelection(d);
        } else {
            // Clear any existing multi-selection
            clearMultiSelection();
            selectNode(d);
        }
    };
}

/**
 * Create node hover handlers
 */
function createNodeHoverHandlers(showNodeTooltip, hideNodeTooltip) {
    const mouseenter = function(event, d) {
        const g = getG();
        
        // Highlight node on hover
        d3.select(this).select('circle')
            .attr('stroke-width', 4)
            .attr('stroke', '#f39c12');
        
        // Highlight connected edges
        g.selectAll('.link')
            .attr('stroke-opacity', linkData => {
                // Check if this edge is connected to the hovered node
                const isConnected = linkData.source.id === d.id || linkData.target.id === d.id;
                return isConnected ? 0.9 : 0.2;
            })
            .attr('stroke-width', linkData => {
                const isConnected = linkData.source.id === d.id || linkData.target.id === d.id;
                if (isConnected) {
                    return Math.max(2.5, calculateEdgeWeight(linkData) * 1.3);
                }
                return calculateEdgeWeight(linkData);
            });
        
        // Dim non-connected nodes
        g.selectAll('.node').select('circle')
            .attr('opacity', nodeData => {
                // Keep full opacity for hovered node and connected nodes
                if (nodeData.id === d.id) return 1;
                const isConnected = d.imports.includes(nodeData.id) || 
                                  d.importedBy.includes(nodeData.id);
                return isConnected ? 1 : 0.3;
            });
        
        // Show node tooltip
        if (showNodeTooltip) showNodeTooltip(event, d);
    };
    
    const mouseleave = function(event, d) {
        const g = getG();
        
        // Reset edge styling
        g.selectAll('.link')
            .attr('stroke-opacity', 0.7)
            .attr('stroke-width', linkData => linkData.thickness || calculateEdgeWeight(linkData));
        
        // Reset node opacity
        g.selectAll('.node').select('circle')
            .attr('opacity', 1);
        
        // Reset node styling (unless selected)
        const isSelected = g.selectAll('.node')
            .filter(n => n.id === d.id)
            .select('circle')
            .attr('stroke') === '#e74c3c';
        
        if (!isSelected) {
            d3.select(this).select('circle')
                .attr('stroke-width', 2)
                .attr('stroke', '#fff');
        }
        
        // Hide node tooltip
        if (hideNodeTooltip) hideNodeTooltip();
    };
    
    return { mouseenter, mouseleave };
}

/**
 * Deselect all nodes
 */
function deselectAllNodes() {
    const g = getG();
    if (g) {
        // Reset all node styling
        g.selectAll('.node circle')
            .attr('stroke', '#fff')
            .attr('stroke-width', 2);
        
        // Reset info panel
        document.getElementById('file-info').innerHTML = '<p>Select a node or edge to view details</p>';
    }
}

/**
 * Highlight node by file path
 */
function highlightNode(filePath) {
    const g = getG();
    if (!g) return;
    
    // Clear existing highlights
    clearSearchHighlight();
    
    // Highlight the specific node
    g.selectAll('.node')
        .filter(d => d.id === filePath)
        .select('circle')
        .attr('stroke', '#e74c3c')
        .attr('stroke-width', 4);
    
    // Select the node (update info panel)
    const nodes = getNodes();
    const nodeData = nodes.find(d => d.id === filePath);
    if (nodeData) {
        selectNode(nodeData, false, null);
    }
}

/**
 * Clear search highlight
 */
function clearSearchHighlight() {
    const g = getG();
    if (g) {
        g.selectAll('.node circle')
            .attr('stroke', '#fff')
            .attr('stroke-width', 2);
    }
}

/**
 * Highlight search results
 */
function highlightSearchResults(searchTerm) {
    const g = getG();
    g.selectAll('.node circle')
        .attr('stroke', d => {
            const fileName = d.path.split('/').pop().toLowerCase();
            const matches = fileName.includes(searchTerm) || d.path.toLowerCase().includes(searchTerm);
            return matches ? '#e74c3c' : '#fff';
        })
        .attr('stroke-width', d => {
            const fileName = d.path.split('/').pop().toLowerCase();
            const matches = fileName.includes(searchTerm) || d.path.toLowerCase().includes(searchTerm);
            return matches ? 4 : 2;
        });
}

export {
    selectNode,
    selectEdge,
    createDragHandlers,
    createNodeClickHandler,
    createNodeHoverHandlers,
    deselectAllNodes,
    highlightNode,
    clearSearchHighlight,
    highlightSearchResults
};
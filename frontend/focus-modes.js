/**
 * Focus Mode and Selection Features Module
 * Handles focus modes, multi-selection, interface extraction, and connection focus
 */

import { getG, getNodes } from './graph-renderer.js';
import { selectNode } from './interaction-handlers.js';

// Focus mode state
let focusMode = false;
let focusedNode = null;
let connectionFocusMode = false;
let focusedConnection = null;

// Multi-selection state
let multiSelectMode = false;
let selectedNodes = new Set();
let isShiftPressed = false;

/**
 * Toggle node focus mode
 */
function toggleFocusMode(nodeId) {
    if (focusMode && focusedNode === nodeId) {
        // Exit focus mode
        exitFocusMode();
    } else {
        // Enter focus mode
        enterFocusMode(nodeId);
    }
}

/**
 * Enter focus mode for a specific node
 */
function enterFocusMode(nodeId) {
    focusMode = true;
    focusedNode = nodeId;
    
    const nodes = getNodes();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    // Get connected node IDs
    const connectedNodeIds = new Set([nodeId]);
    node.imports.forEach(id => connectedNodeIds.add(id));
    node.importedBy.forEach(id => connectedNodeIds.add(id));
    
    const g = getG();
    
    // Smooth transition for hiding non-connected nodes
    g.selectAll('.node')
        .transition()
        .duration(500)
        .ease(d3.easeQuadInOut)
        .style('opacity', d => connectedNodeIds.has(d.id) ? 1 : 0.1)
        .on('end', function(d) {
            // Disable pointer events after transition
            d3.select(this).style('pointer-events', connectedNodeIds.has(d.id) ? 'all' : 'none');
        });
    
    // Smooth transition for hiding non-connected edges
    g.selectAll('.link')
        .transition()
        .duration(500)
        .ease(d3.easeQuadInOut)
        .style('opacity', d => connectedNodeIds.has(d.source.id) && connectedNodeIds.has(d.target.id) ? 0.7 : 0.05)
        .on('end', function(d) {
            // Disable pointer events after transition
            const isConnected = connectedNodeIds.has(d.source.id) && connectedNodeIds.has(d.target.id);
            d3.select(this).style('pointer-events', isConnected ? 'all' : 'none');
        });
    
    // Update info panel
    const selectedNode = nodes.find(n => n.id === nodeId);
    if (selectedNode) {
        selectNode(selectedNode, focusMode, focusedNode);
    }
}

/**
 * Exit focus mode
 */
function exitFocusMode() {
    const oldFocusedNode = focusedNode;
    focusMode = false;
    focusedNode = null;
    
    const g = getG();
    
    // Smooth transition for showing all nodes and edges
    g.selectAll('.node')
        .transition()
        .duration(500)
        .ease(d3.easeQuadInOut)
        .style('opacity', 1)
        .on('end', function() {
            d3.select(this).style('pointer-events', 'all');
        });
    
    g.selectAll('.link')
        .transition()
        .duration(500)
        .ease(d3.easeQuadInOut)
        .style('opacity', 0.7)
        .on('end', function() {
            d3.select(this).style('pointer-events', 'all');
        });
    
    // Update info panel
    if (oldFocusedNode) {
        const nodes = getNodes();
        const selectedNode = nodes.find(n => n.id === oldFocusedNode);
        if (selectedNode) {
            selectNode(selectedNode, focusMode, focusedNode);
        }
    }
}

/**
 * Multi-selection functions
 */
function toggleNodeSelection(nodeData) {
    if (selectedNodes.has(nodeData.id)) {
        selectedNodes.delete(nodeData.id);
    } else {
        selectedNodes.add(nodeData.id);
    }
    
    updateMultiSelectionVisual();
    updateMultiSelectionPanel();
}

function clearMultiSelection() {
    selectedNodes.clear();
    updateMultiSelectionVisual();
    updateMultiSelectionPanel();
}

function updateMultiSelectionVisual() {
    const g = getG();
    
    // Update node styling based on selection state
    g.selectAll('.node circle')
        .transition()
        .duration(200)
        .ease(d3.easeQuadOut)
        .attr('stroke', d => {
            if (selectedNodes.has(d.id)) {
                return '#e74c3c'; // Selected color
            }
            return '#fff'; // Default color
        })
        .attr('stroke-width', d => {
            if (selectedNodes.has(d.id)) {
                return 4; // Thicker border for selected
            }
            return 2; // Default width
        });
    
    // Update the count in the indicator if it exists
    const indicator = document.querySelector('.multi-select-indicator');
    if (indicator && indicator.updateCount) {
        indicator.updateCount();
    }
}

function updateMultiSelectionPanel() {
    if (selectedNodes.size === 0) {
        // Show default panel
        document.getElementById('file-info').innerHTML = '<p>Select a node or edge to view details</p>';
        return;
    }
    
    if (selectedNodes.size === 1) {
        // Show single node details
        const nodeId = selectedNodes.values().next().value;
        const nodes = getNodes();
        const nodeData = nodes.find(n => n.id === nodeId);
        if (nodeData) {
            selectNode(nodeData, focusMode, focusedNode);
        }
        return;
    }
    
    // Show multi-selection interface extraction panel
    showInterfaceExtractionPanel();
}

function showInterfaceExtractionPanel() {
    const nodes = getNodes();
    const selectedNodesList = Array.from(selectedNodes).map(id => nodes.find(n => n.id === id)).filter(Boolean);
    
    if (selectedNodesList.length < 2) {
        document.getElementById('file-info').innerHTML = '<p>Select at least 2 nodes for interface extraction</p>';
        return;
    }
    
    // Extract interface information
    const interfaceData = extractInterface(selectedNodesList);
    
    const fileInfo = document.getElementById('file-info');
    fileInfo.innerHTML = `
        <div class="interface-extraction">
            <h4>Interface Extraction</h4>
            <p><strong>Selected Modules:</strong> ${selectedNodes.size}</p>
            <div class="selected-modules">
                ${selectedNodesList.map(node => 
                    `<span class="module-tag">${node.name}</span>`
                ).join('')}
            </div>
            
            <div class="interface-results">
                <h5>Common Dependencies (Intersection)</h5>
                <div class="interface-section">
                    ${interfaceData.intersection.length > 0 ? `
                        <ul class="interface-list">
                            ${interfaceData.intersection.map(dep => `<li>${dep}</li>`).join('')}
                        </ul>
                    ` : '<p class="no-results">No common dependencies found</p>'}
                </div>
                
                <h5>All Dependencies (Union)</h5>
                <div class="interface-section">
                    ${interfaceData.union.length > 0 ? `
                        <ul class="interface-list">
                            ${interfaceData.union.slice(0, 20).map(dep => `<li>${dep}</li>`).join('')}
                            ${interfaceData.union.length > 20 ? `<li class="more-items">... and ${interfaceData.union.length - 20} more</li>` : ''}
                        </ul>
                    ` : '<p class="no-results">No dependencies found</p>'}
                </div>
            </div>
            
            <div class="interface-actions">
                <button class="action-btn" onclick="copyInterfaceToClipboard()">
                    📋 Copy Interface
                </button>
                <button class="action-btn" onclick="clearMultiSelection()">
                    ✖ Clear Selection
                </button>
            </div>
        </div>
    `;
}

function extractInterface(selectedNodes) {
    const allDependencies = new Map(); // dependency -> count
    const nodeDependencies = []; // array of dependency sets
    
    // Collect all dependencies from selected nodes
    selectedNodes.forEach(node => {
        const deps = new Set([...node.imports, ...node.importedBy]);
        nodeDependencies.push(deps);
        
        deps.forEach(dep => {
            allDependencies.set(dep, (allDependencies.get(dep) || 0) + 1);
        });
    });
    
    // Calculate intersection (dependencies common to ALL nodes)
    const intersection = [];
    if (nodeDependencies.length > 0) {
        for (const [dep, count] of allDependencies.entries()) {
            if (count === selectedNodes.length) {
                intersection.push(dep);
            }
        }
    }
    
    // Calculate union (all unique dependencies)
    const union = Array.from(allDependencies.keys());
    
    return {
        intersection: intersection.sort(),
        union: union.sort(),
        stats: {
            totalSelected: selectedNodes.length,
            commonDeps: intersection.length,
            totalDeps: union.length
        }
    };
}

function copyInterfaceToClipboard() {
    const nodes = getNodes();
    const selectedNodesList = Array.from(selectedNodes).map(id => nodes.find(n => n.id === id)).filter(Boolean);
    const interfaceData = extractInterface(selectedNodesList);
    
    const interfaceText = `
// Interface Extraction Result
// Selected Modules: ${selectedNodesList.map(n => n.name).join(', ')}

// Common Dependencies (Intersection):
${interfaceData.intersection.length > 0 ? 
    interfaceData.intersection.map(dep => `// - ${dep}`).join('\n') : 
    '// No common dependencies found'
}

// All Dependencies (Union):
${interfaceData.union.map(dep => `// - ${dep}`).join('\n')}

// Statistics:
// - Selected modules: ${interfaceData.stats.totalSelected}
// - Common dependencies: ${interfaceData.stats.commonDeps}
// - Total unique dependencies: ${interfaceData.stats.totalDeps}
    `.trim();
    
    navigator.clipboard.writeText(interfaceText).then(() => {
        showTemporaryMessage('Interface copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy to clipboard:', err);
        showTemporaryMessage('Failed to copy to clipboard', true);
    });
}

function showTemporaryMessage(message, isError = false) {
    // Remove any existing message
    const existing = document.querySelector('.temp-message');
    if (existing) existing.remove();
    
    const messageEl = document.createElement('div');
    messageEl.className = `temp-message ${isError ? 'error' : 'success'}`;
    messageEl.textContent = message;
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
        if (messageEl.parentNode) {
            messageEl.remove();
        }
    }, 3000);
}

function updateMultiSelectIndicator(isActive) {
    // Remove any existing indicator
    const existing = document.querySelector('.multi-select-indicator');
    if (existing) existing.remove();
    
    if (isActive) {
        const indicator = document.createElement('div');
        indicator.className = 'multi-select-indicator';
        indicator.innerHTML = `
            <span class="multi-icon">⌘</span>
            <span class="multi-text">Multi-select mode: Click nodes to select multiple</span>
            <span class="multi-count">${selectedNodes.size} selected</span>
        `;
        document.body.appendChild(indicator);
        
        // Update count when selection changes
        const updateCount = () => {
            const countSpan = indicator.querySelector('.multi-count');
            if (countSpan) {
                countSpan.textContent = `${selectedNodes.size} selected`;
            }
        };
        
        // Store update function for later use
        indicator.updateCount = updateCount;
    }
}

/**
 * Connection focus functions
 */
let highlightedPath = null;

function isPathHighlighted(sourceId, targetId) {
    return highlightedPath === `${sourceId}-${targetId}`;
}

function toggleHighlightPath(sourceId, targetId) {
    const pathKey = `${sourceId}-${targetId}`;
    
    if (highlightedPath === pathKey) {
        // Clear highlight - reset to full view
        clearAllHighlights();
    } else {
        // Apply highlight
        highlightedPath = pathKey;
        highlightPath(sourceId, targetId);
    }
    
    // Update button state
    updateEdgeActionButtons(sourceId, targetId);
}

function highlightPath(sourceId, targetId) {
    const g = getG();
    
    // Find and highlight the specific path
    g.selectAll('.link')
        .transition()
        .duration(300)
        .ease(d3.easeQuadOut)
        .attr('stroke-opacity', d => (d.source.id === sourceId && d.target.id === targetId) ? 0.9 : 0.2);
    
    g.selectAll('.node circle')
        .transition()
        .duration(300)
        .ease(d3.easeQuadOut)
        .attr('opacity', d => (d.id === sourceId || d.id === targetId) ? 1 : 0.3);
}

function toggleConnectionFocus(sourceId, targetId) {
    const connectionKey = `${sourceId}-${targetId}`;
    
    if (connectionFocusMode && focusedConnection === connectionKey) {
        // Exit connection focus
        exitConnectionFocus();
    } else {
        // Enter connection focus
        enterConnectionFocus(sourceId, targetId);
    }
    
    // Update button state
    updateEdgeActionButtons(sourceId, targetId);
}

function enterConnectionFocus(sourceId, targetId) {
    connectionFocusMode = true;
    focusedConnection = `${sourceId}-${targetId}`;
    
    // Enter focus mode on both connected nodes
    const connectedNodeIds = new Set([sourceId, targetId]);
    
    const g = getG();
    
    // Fade non-connected elements
    g.selectAll('.node')
        .transition()
        .duration(500)
        .ease(d3.easeQuadInOut)
        .style('opacity', d => connectedNodeIds.has(d.id) ? 1 : 0.1)
        .on('end', function(d) {
            d3.select(this).style('pointer-events', connectedNodeIds.has(d.id) ? 'all' : 'none');
        });
    
    g.selectAll('.link')
        .transition()
        .duration(500)
        .ease(d3.easeQuadInOut)
        .style('opacity', d => connectedNodeIds.has(d.source.id) && connectedNodeIds.has(d.target.id) ? 0.7 : 0.05)
        .on('end', function(d) {
            const isConnected = connectedNodeIds.has(d.source.id) && connectedNodeIds.has(d.target.id);
            d3.select(this).style('pointer-events', isConnected ? 'all' : 'none');
        });
}

function exitConnectionFocus() {
    connectionFocusMode = false;
    focusedConnection = null;
    
    const g = getG();
    
    // Restore full view
    g.selectAll('.node')
        .transition()
        .duration(500)
        .ease(d3.easeQuadInOut)
        .style('opacity', 1)
        .on('end', function() {
            d3.select(this).style('pointer-events', 'all');
        });
    
    g.selectAll('.link')
        .transition()
        .duration(500)
        .ease(d3.easeQuadInOut)
        .style('opacity', 0.7)
        .on('end', function() {
            d3.select(this).style('pointer-events', 'all');
        });
    
    // Update any visible button states
    updateAllEdgeButtons();
}

function clearAllHighlights() {
    highlightedPath = null;
    
    const g = getG();
    
    // Reset all styling to normal
    g.selectAll('.link')
        .transition()
        .duration(300)
        .ease(d3.easeQuadOut)
        .attr('stroke-opacity', 0.7);
    
    g.selectAll('.node circle')
        .transition()
        .duration(300)
        .ease(d3.easeQuadOut)
        .attr('opacity', 1);
    
    // Update any visible button states
    updateAllEdgeButtons();
}

function updateEdgeActionButtons(sourceId, targetId) {
    const connectionKey = `${sourceId}-${targetId}`;
    
    // Find buttons by data attributes in the current edge details panel
    const highlightBtn = document.querySelector(`#highlight-btn[data-source="${sourceId}"][data-target="${targetId}"]`);
    const focusBtn = document.querySelector(`#focus-btn[data-source="${sourceId}"][data-target="${targetId}"]`);
    
    if (highlightBtn) {
        const isHighlighted = isPathHighlighted(sourceId, targetId);
        highlightBtn.textContent = isHighlighted ? 'Clear Highlight' : 'Highlight Path';
        highlightBtn.className = isHighlighted ? 'action-btn active' : 'action-btn';
    }
    
    if (focusBtn) {
        const isFocused = connectionFocusMode && focusedConnection === connectionKey;
        focusBtn.textContent = isFocused ? 'Exit Focus' : 'Focus Connection';
        focusBtn.className = isFocused ? 'action-btn active' : 'action-btn';
    }
}

function updateAllEdgeButtons() {
    // Find all edge action buttons by data attributes
    const highlightBtns = document.querySelectorAll('#highlight-btn[data-source][data-target]');
    const focusBtns = document.querySelectorAll('#focus-btn[data-source][data-target]');
    
    highlightBtns.forEach(btn => {
        const sourceId = btn.dataset.source;
        const targetId = btn.dataset.target;
        if (sourceId && targetId) {
            const isHighlighted = isPathHighlighted(sourceId, targetId);
            btn.textContent = isHighlighted ? 'Clear Highlight' : 'Highlight Path';
            btn.className = isHighlighted ? 'action-btn active' : 'action-btn';
        }
    });
    
    focusBtns.forEach(btn => {
        const sourceId = btn.dataset.source;
        const targetId = btn.dataset.target;
        if (sourceId && targetId) {
            const connectionKey = `${sourceId}-${targetId}`;
            const isFocused = connectionFocusMode && focusedConnection === connectionKey;
            btn.textContent = isFocused ? 'Exit Focus' : 'Focus Connection';
            btn.className = isFocused ? 'action-btn active' : 'action-btn';
        }
    });
}

export {
    // Focus mode functions
    toggleFocusMode,
    enterFocusMode,
    exitFocusMode,
    
    // Multi-selection functions
    toggleNodeSelection,
    clearMultiSelection,
    updateMultiSelectionVisual,
    updateMultiSelectionPanel,
    updateMultiSelectIndicator,
    extractInterface,
    copyInterfaceToClipboard,
    showTemporaryMessage,
    
    // Connection focus functions
    toggleHighlightPath,
    toggleConnectionFocus,
    enterConnectionFocus,
    exitConnectionFocus,
    clearAllHighlights,
    highlightPath,
    isPathHighlighted,
    updateEdgeActionButtons,
    updateAllEdgeButtons,
    
    // State getters
    getFocusMode: () => focusMode,
    getFocusedNode: () => focusedNode,
    getConnectionFocusMode: () => connectionFocusMode,
    getFocusedConnection: () => focusedConnection,
    getMultiSelectMode: () => multiSelectMode,
    getSelectedNodes: () => selectedNodes,
    getIsShiftPressed: () => isShiftPressed,
    
    // State setters (for keyboard handlers)
    setMultiSelectMode: (value) => { multiSelectMode = value; },
    setIsShiftPressed: (value) => { isShiftPressed = value; }
};
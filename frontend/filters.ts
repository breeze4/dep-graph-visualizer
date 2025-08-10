/**
 * Filtering and Search Functionality Module
 * Handles graph filtering, search highlighting, and filter controls
 */
import * as d3 from 'd3';

import { getG } from './graph-renderer.ts';
import { clearSearchHighlight } from './interaction-handlers.ts';
import { exitFocusMode, exitConnectionFocus, clearAllHighlights } from './focus-modes.ts';
import { debounce } from './dom-setup.ts';

/**
 * Apply filters to the graph
 */
function applyFilters(currentGraphData, updateGraphStatistics) {
    if (!currentGraphData || !getG()) return;
    
    const g = getG();
    const showApps = document.getElementById('show-apps').checked;
    const showLibs = document.getElementById('show-libs').checked;
    const minLoc = parseInt(document.getElementById('min-loc').value);
    const searchTerm = document.getElementById('search-input').value.toLowerCase().trim();
    
    let filteredNodes = [];
    
    // Handle both new spec format and legacy format
    if (currentGraphData.nodes && currentGraphData.edges) {
        // New spec format
        currentGraphData.nodes.forEach(node => {
            // Type filter
            if (node.type === 'app' && !showApps) return;
            if (node.type === 'lib' && !showLibs) return;
            
            // LOC filter
            if (node.linesOfCode < minLoc) return;
            
            // Search filter
            if (searchTerm && !node.id.toLowerCase().includes(searchTerm) && 
                !node.id.split('/').pop().toLowerCase().includes(searchTerm)) return;
            
            filteredNodes.push(node.id);
        });
    } else if (currentGraphData.graph) {
        // Legacy format
        Object.keys(currentGraphData.graph).forEach(filePath => {
            const nodeData = currentGraphData.graph[filePath];
            const isApp = filePath.startsWith('apps/');
            const isLib = filePath.startsWith('libs/');
            const fileName = filePath.split('/').pop().toLowerCase();
            
            // Type filter
            if (isApp && !showApps) return;
            if (isLib && !showLibs) return;
            
            // LOC filter
            if (nodeData.linesOfCode < minLoc) return;
            
            // Search filter
            if (searchTerm && !fileName.includes(searchTerm) && !filePath.toLowerCase().includes(searchTerm)) return;
            
            filteredNodes.push(filePath);
        });
    }
    
    // Update node visibility with smooth transitions
    g.selectAll('.node')
        .transition()
        .duration(300)
        .ease(d3.easeQuadOut)
        .style('opacity', d => {
            const isVisible = filteredNodes.includes(d.id);
            return isVisible ? 1 : 0.1;
        })
        .style('pointer-events', d => {
            const isVisible = filteredNodes.includes(d.id);
            return isVisible ? 'all' : 'none';
        });
    
    // Update link visibility (only show links between visible nodes)
    g.selectAll('.link')
        .transition()
        .duration(300)
        .ease(d3.easeQuadOut)
        .style('opacity', d => {
            const sourceVisible = filteredNodes.includes(d.source.id);
            const targetVisible = filteredNodes.includes(d.target.id);
            return sourceVisible && targetVisible ? 0.7 : 0.05;
        })
        .style('pointer-events', d => {
            const sourceVisible = filteredNodes.includes(d.source.id);
            const targetVisible = filteredNodes.includes(d.target.id);
            return sourceVisible && targetVisible ? 'all' : 'none';
        });
    
    // Update click areas visibility
    if (g.selectAll('.link-click-area').size() > 0) {
        g.selectAll('.link-click-area')
            .transition()
            .duration(300)
            .ease(d3.easeQuadOut)
            .style('opacity', d => {
                const sourceVisible = filteredNodes.includes(d.source.id);
                const targetVisible = filteredNodes.includes(d.target.id);
                return sourceVisible && targetVisible ? 1 : 0;
            })
            .style('pointer-events', d => {
                const sourceVisible = filteredNodes.includes(d.source.id);
                const targetVisible = filteredNodes.includes(d.target.id);
                return sourceVisible && targetVisible ? 'all' : 'none';
            });
    }
    
    // Highlight search results if there's a search term
    if (searchTerm) {
        highlightSearchResultsInFiltered(searchTerm, filteredNodes);
    } else {
        clearSearchHighlight();
    }
    
    // Update statistics for filtered view
    if (updateGraphStatistics) {
        updateGraphStatistics(currentGraphData, filteredNodes);
    }
}

/**
 * Highlight search results within filtered nodes
 */
function highlightSearchResultsInFiltered(searchTerm, visibleNodes) {
    const g = getG();
    g.selectAll('.node circle')
        .transition()
        .duration(200)
        .ease(d3.easeQuadOut)
        .attr('stroke', d => {
            if (!visibleNodes.includes(d.id)) return '#fff';
            const fileName = d.id.split('/').pop().toLowerCase();
            const matches = fileName.includes(searchTerm) || d.id.toLowerCase().includes(searchTerm);
            return matches ? '#e74c3c' : '#fff';
        })
        .attr('stroke-width', d => {
            if (!visibleNodes.includes(d.id)) return 2;
            const fileName = d.id.split('/').pop().toLowerCase();
            const matches = fileName.includes(searchTerm) || d.id.toLowerCase().includes(searchTerm);
            return matches ? 4 : 2;
        });
}

/**
 * Toggle node labels visibility
 */
function toggleNodeLabels() {
    const showLabels = document.getElementById('toggle-labels').checked;
    const g = getG();
    if (g) {
        g.selectAll('.node-label')
            .transition()
            .duration(200)
            .ease(d3.easeQuadOut)
            .style('opacity', showLabels ? 1 : 0);
    }
}

/**
 * Update minimum lines of code filter
 */
function updateMinLoc(applyFilters) {
    const minLoc = parseInt(document.getElementById('min-loc').value);
    document.getElementById('loc-value').textContent = minLoc;
    applyFilters();
}

/**
 * Reset all filters to default values
 */
function resetFilters(applyFilters) {
    document.getElementById('show-apps').checked = true;
    document.getElementById('show-libs').checked = true;
    document.getElementById('min-loc').value = 0;
    document.getElementById('loc-value').textContent = '0';
    document.getElementById('search-input').value = '';
    
    // Clear any focus modes
    if (getFocusMode && getFocusMode()) exitFocusMode();
    if (getConnectionFocusMode && getConnectionFocusMode()) exitConnectionFocus();
    clearAllHighlights();
    
    applyFilters();
}

/**
 * Create debounced filter function for search input
 */
function createDebouncedFilters(applyFilters, delay = 300) {
    return debounce(applyFilters, delay);
}

/**
 * Legacy format filter application (kept for compatibility)
 */
function applyFiltersLegacy(currentGraphData, updateGraphStatistics) {
    if (!currentGraphData || !getG()) return;
    
    const g = getG();
    const showApps = document.getElementById('show-apps').checked;
    const showLibs = document.getElementById('show-libs').checked;
    const minLoc = parseInt(document.getElementById('min-loc').value);
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    
    const graph = currentGraphData.graph;
    const filteredNodes = [];
    
    // Apply filters
    Object.keys(graph).forEach(filePath => {
        const nodeData = graph[filePath];
        const isApp = filePath.startsWith('apps/');
        const isLib = filePath.startsWith('libs/');
        const fileName = filePath.split('/').pop().toLowerCase();
        
        // Type filter
        if (isApp && !showApps) return;
        if (isLib && !showLibs) return;
        
        // LOC filter
        if (nodeData.linesOfCode < minLoc) return;
        
        // Search filter
        if (searchTerm && !fileName.includes(searchTerm) && !filePath.toLowerCase().includes(searchTerm)) return;
        
        filteredNodes.push(filePath);
    });
    
    // Update node visibility
    g.selectAll('.node').style('display', d => {
        const isVisible = filteredNodes.includes(d.id);
        return isVisible ? 'block' : 'none';
    });
    
    // Update link visibility (only show links between visible nodes)
    g.selectAll('.link').style('display', d => {
        const sourceVisible = filteredNodes.includes(d.source.id);
        const targetVisible = filteredNodes.includes(d.target.id);
        return sourceVisible && targetVisible ? 'block' : 'none';
    });
    
    // Highlight search results
    if (searchTerm) {
        highlightSearchResultsInFiltered(searchTerm, filteredNodes);
    } else {
        clearSearchHighlight();
    }
    
    // Update statistics
    if (updateGraphStatistics) {
        updateGraphStatistics(currentGraphData, filteredNodes);
    }
}

export {
    applyFilters,
    applyFiltersLegacy,
    toggleNodeLabels,
    updateMinLoc,
    resetFilters,
    createDebouncedFilters,
    highlightSearchResultsInFiltered
};
/**
 * Main Application Coordination Script
 * Imports and coordinates all feature modules
 */
import {
    initializeDOMElements,
    initializeUploadHandlers,
    initializeControlHandlers,
    initializeKeyboardHandlers,
    initializeWindowHandlers,
    togglePanel,
    getDimensions
} from './dom-setup.ts';

import {
    loadDefaultGraph,
    processFile,
    validateAndLoadGraph,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    showUploadInterface,
    showMainInterface
} from './file-processor.ts';

import {
    transformGraphData
} from './graph-transformer.ts';

import {
    initializeD3Visualization,
    renderGraph,
    resetGraphView,
    getCurrentSimulation,
    getSvg,
    getG,
    getZoom
} from './graph-renderer.ts';

import {
    selectNode,
    selectEdge,
    createDragHandlers,
    createNodeClickHandler,
    createNodeHoverHandlers
} from './interaction-handlers.ts';

import {
    toggleFocusMode,
    exitFocusMode,
    toggleNodeSelection,
    clearMultiSelection,
    updateMultiSelectIndicator,
    copyInterfaceToClipboard,
    toggleHighlightPath,
    toggleConnectionFocus,
    exitConnectionFocus,
    clearAllHighlights,
    isPathHighlighted,
    getFocusMode,
    getFocusedNode,
    getConnectionFocusMode,
    getFocusedConnection,
    getMultiSelectMode
} from './focus-modes.ts';

import {
    applyFilters,
    toggleNodeLabels,
    updateMinLoc,
    resetFilters
} from './filters.ts';

import {
    showNodeTooltip,
    hideNodeTooltip,
    showLinkTooltip,
    hideLinkTooltip,
    updateTooltipPosition
} from './tooltips.ts';

import {
    updateGraphStatistics
} from './stats-ui.ts';

/**
 * Application state
 */
let currentGraphData = null;
let currentSimulation = null;
let performanceMode = false;

/**
 * Initialize the application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dependency Graph Visualizer loaded successfully');
    
    // Initialize DOM elements
    initializeDOMElements();
    
    // Initialize keyboard handlers
    const keyboardState = initializeKeyboardHandlers(
        updateMultiSelectIndicator,
        clearMultiSelection
    );
    
    // Create wrapped functions with necessary context
    const wrappedValidateAndLoadGraph = (data, fromCache = false, cacheKey = null) => {
        const result = validateAndLoadGraph(data, fromCache, cacheKey, updateGraphStatistics, showMainInterface);
        if (result) {
            currentGraphData = result;
        }
        return result;
    };
    
    const wrappedProcessFile = (file) => {
        processFile(file, wrappedValidateAndLoadGraph);
    };
    
    const wrappedApplyFilters = () => {
        applyFilters(currentGraphData, updateGraphStatistics);
    };
    
    const wrappedUpdateMinLoc = () => {
        updateMinLoc(wrappedApplyFilters);
    };
    
    const wrappedResetFilters = () => {
        resetFilters(wrappedApplyFilters);
    };
    
    const wrappedResetGraphView = () => {
        // Exit focus modes first
        if (getFocusMode()) exitFocusMode();
        if (getConnectionFocusMode()) exitConnectionFocus();
        clearAllHighlights();
        clearMultiSelection();
        
        // Reset the graph view
        resetGraphView(getSvg(), getZoom(), getG());
        
        // Reset info panel
        document.getElementById('file-info').innerHTML = '<p>Select a node or edge to view details</p>';
    };
    
    // Initialize event handlers
    initializeUploadHandlers(
        handleDragOver,
        handleDragEnter,
        handleDragLeave,
        (e) => handleDrop(e, wrappedProcessFile),
        (e) => handleFileSelect(e, wrappedProcessFile)
    );
    
    initializeControlHandlers(
        showUploadInterface,
        wrappedResetGraphView,
        toggleNodeLabels,
        wrappedApplyFilters,
        wrappedUpdateMinLoc,
        wrappedResetFilters,
        togglePanel
    );
    
    // Initialize window handlers
    initializeWindowHandlers(getSvg(), getG(), getCurrentSimulation(), updateTooltipPosition);
    
    // Auto-load default dependency graph for development
    loadDefaultGraph(wrappedValidateAndLoadGraph);
    
    // Initialize D3 visualization when ready
    function initializeVisualizationWhenReady() {
        if (currentGraphData) {
            // Force layout recalculation
            setTimeout(() => {
                const d3Data = initializeD3Visualization(currentGraphData);
                currentSimulation = d3Data.currentSimulation;
                
                // Set up rendering with all necessary handlers
                const dragHandlers = createDragHandlers(currentSimulation);
                
                const nodeClickHandler = createNodeClickHandler(
                    getMultiSelectMode(),
                    toggleNodeSelection,
                    clearMultiSelection,
                    (nodeData) => selectNode(nodeData, getFocusMode(), getFocusedNode())
                );
                
                const nodeHoverHandlers = createNodeHoverHandlers(
                    showNodeTooltip,
                    hideNodeTooltip
                );
                
                const edgeHandlers = {
                    selectEdge: (edgeData) => selectEdge(
                        edgeData,
                        performanceMode,
                        isPathHighlighted,
                        getConnectionFocusMode(),
                        getFocusedConnection()
                    )
                };
                
                // Transform and render graph
                const graphData = transformGraphData(currentGraphData);
                renderGraph(
                    graphData,
                    dragHandlers,
                    nodeClickHandler,
                    nodeHoverHandlers,
                    edgeHandlers,
                    showLinkTooltip,
                    hideLinkTooltip
                );
            }, 50);
        }
    }
    
    // Store the initialization function globally so it can be called when interface is shown
    window.initializeVisualizationWhenReady = initializeVisualizationWhenReady;
    
    // Make functions globally available for button onclick handlers
    window.toggleFocusMode = toggleFocusMode;
    window.toggleHighlightPath = toggleHighlightPath;
    window.toggleConnectionFocus = toggleConnectionFocus;
    window.isPathHighlighted = isPathHighlighted;
    window.copyInterfaceToClipboard = copyInterfaceToClipboard;
    window.clearMultiSelection = clearMultiSelection;
});


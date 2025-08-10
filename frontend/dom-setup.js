/**
 * DOM Setup and Initialization Module
 * Handles DOM element references, event listeners, and initialization
 */

// Global DOM elements that are used across modules
let dropZone, fileInput, browseBtn, loadingMessage, errorMessage, successMessage;
let errorText, successText, uploadSection, mainLayout, newFileBtn, resetGraphBtn;
let width, height;

// Initialize all DOM references
function initializeDOMElements() {
    dropZone = document.getElementById('drop-zone');
    fileInput = document.getElementById('file-input');
    browseBtn = document.getElementById('browse-btn');
    loadingMessage = document.getElementById('loading-message');
    errorMessage = document.getElementById('error-message');
    successMessage = document.getElementById('success-message');
    errorText = document.getElementById('error-text');
    successText = document.getElementById('success-text');
    uploadSection = document.getElementById('upload-section');
    mainLayout = document.getElementById('main-layout');
    newFileBtn = document.getElementById('new-file');
    resetGraphBtn = document.getElementById('reset-graph');
}

/**
 * Initialize upload-related event handlers
 */
function initializeUploadHandlers(handleDragOver, handleDragEnter, handleDragLeave, handleDrop, handleFileSelect) {
    // Drag and drop handlers
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragenter', handleDragEnter);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);
    
    // Click to browse handler
    browseBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    
    // Prevent default drag behaviors on the entire page
    document.addEventListener('dragover', (e) => e.preventDefault());
    document.addEventListener('drop', (e) => e.preventDefault());
}

/**
 * Initialize control-related event handlers
 */
function initializeControlHandlers(showUploadInterface, resetGraphView, toggleNodeLabels, applyFilters, updateMinLoc, resetFilters, togglePanel) {
    newFileBtn.addEventListener('click', showUploadInterface);
    resetGraphBtn.addEventListener('click', resetGraphView);
    
    // Control event listeners
    const labelToggle = document.getElementById('toggle-labels');
    const showApps = document.getElementById('show-apps');
    const showLibs = document.getElementById('show-libs');
    const minLoc = document.getElementById('min-loc');
    const searchInput = document.getElementById('search-input');
    const resetFiltersBtn = document.getElementById('reset-filters');
    
    if (labelToggle) labelToggle.addEventListener('change', toggleNodeLabels);
    if (showApps) showApps.addEventListener('change', applyFilters);
    if (showLibs) showLibs.addEventListener('change', applyFilters);
    if (minLoc) minLoc.addEventListener('input', updateMinLoc);
    if (searchInput) searchInput.addEventListener('input', debounce(applyFilters, 300));
    if (resetFiltersBtn) resetFiltersBtn.addEventListener('click', resetFilters);
    
    // Collapsible panel handlers
    const collapseImported = document.getElementById('collapse-imported');
    const collapseExports = document.getElementById('collapse-exports');
    
    if (collapseImported) collapseImported.addEventListener('click', () => togglePanel('most-imported-panel', 'collapse-imported'));
    if (collapseExports) collapseExports.addEventListener('click', () => togglePanel('most-exports-panel', 'collapse-exports'));
}

/**
 * Initialize keyboard-related event handlers
 */
function initializeKeyboardHandlers(updateMultiSelectIndicator, clearMultiSelection) {
    let isShiftPressed = false;
    let multiSelectMode = false;
    
    // Global keyboard event listeners for multi-select mode
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Shift') {
            isShiftPressed = true;
            multiSelectMode = true;
            document.body.classList.add('multi-select-mode');
            updateMultiSelectIndicator(true);
        }
        if (event.key === 'Escape') {
            clearMultiSelection();
        }
    });
    
    document.addEventListener('keyup', function(event) {
        if (event.key === 'Shift') {
            isShiftPressed = false;
            multiSelectMode = false;
            document.body.classList.remove('multi-select-mode');
            updateMultiSelectIndicator(false);
        }
    });
    
    // Prevent default behavior on window blur to clean up state
    window.addEventListener('blur', function() {
        isShiftPressed = false;
        multiSelectMode = false;
        document.body.classList.remove('multi-select-mode');
        updateMultiSelectIndicator(false);
    });
    
    // Return state accessors
    return {
        getShiftPressed: () => isShiftPressed,
        getMultiSelectMode: () => multiSelectMode,
        setShiftPressed: (value) => { isShiftPressed = value; },
        setMultiSelectMode: (value) => { multiSelectMode = value; }
    };
}

/**
 * Handle window resize and update graph dimensions
 */
function handleWindowResize(svg, g, currentSimulation) {
    if (svg && currentSimulation) {
        // Update dimensions
        width = window.innerWidth;
        height = window.innerHeight;
        
        // Update SVG dimensions
        svg.attr('viewBox', `0 0 ${width} ${height}`);
        
        // Update background rectangle
        g.select('rect')
            .attr('width', width)
            .attr('height', height);
        
        // Update force simulation center
        currentSimulation
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('x', d3.forceX(width / 2).strength(0.05))
            .force('y', d3.forceY(height / 2).strength(0.05))
            .alpha(0.3)
            .restart();
    }
}

/**
 * Initialize window event listeners
 */
function initializeWindowHandlers(svg, g, currentSimulation, updateTooltipPosition) {
    // Get initial dimensions
    width = window.innerWidth;
    height = window.innerHeight;
    
    // Add resize handler with debouncing
    window.addEventListener('resize', debounce(() => {
        handleWindowResize(svg, g, currentSimulation);
    }, 250));
    
    // Update tooltip position on mouse move
    document.addEventListener('mousemove', function(event) {
        updateTooltipPosition(event);
    });
}

/**
 * Utility function for debouncing function calls
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Toggle collapsible panel state
 */
function togglePanel(panelId, buttonId) {
    const panel = document.getElementById(panelId);
    const button = document.getElementById(buttonId);
    
    if (panel && button) {
        const isCollapsed = panel.classList.contains('collapsed');
        
        if (isCollapsed) {
            // Expand
            panel.classList.remove('collapsed');
            button.textContent = '−';
            button.title = 'Collapse panel';
        } else {
            // Collapse
            panel.classList.add('collapsed');
            button.textContent = '+';
            button.title = 'Expand panel';
        }
    }
}

// Export all functions and element references
export {
    // DOM element references
    dropZone,
    fileInput,
    browseBtn,
    loadingMessage,
    errorMessage,
    successMessage,
    errorText,
    successText,
    uploadSection,
    mainLayout,
    newFileBtn,
    resetGraphBtn,
    width,
    height,
    
    // Initialization functions
    initializeDOMElements,
    initializeUploadHandlers,
    initializeControlHandlers,
    initializeKeyboardHandlers,
    initializeWindowHandlers,
    
    // Utility functions
    debounce,
    togglePanel,
    
    // Dimension getters
    getDimensions: () => ({ width, height }),
    updateDimensions: (w, h) => { width = w; height = h; }
};
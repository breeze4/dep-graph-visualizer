/**
 * File Processing and Validation Module
 * Handles file upload, validation, caching, and progress tracking
 */

import { 
    loadingMessage, 
    errorMessage, 
    successMessage, 
    errorText, 
    successText,
    uploadSection,
    mainLayout,
    fileInput
} from './dom-setup.ts';

// Global cache for parsed graph data
let graphDataCache = new Map();

/**
 * Load default graph on startup
 */
function loadDefaultGraph(validateAndLoadGraph) {
    // Show loading state
    showLoading('Loading dependency graph...');
    updateProgress(5);
    
    // Fetch the default dependency graph
    fetch('./dependency-graph.json')
        .then(response => {
            updateProgress(30, 'Downloading data...');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            updateProgress(50, 'Processing data...');
            // Add small delay to show the progress
            setTimeout(() => {
                validateAndLoadGraph(data);
            }, 200);
        })
        .catch(error => {
            console.warn('Could not load default dependency graph:', error.message);
            // Fall back to showing the upload interface
            hideAllMessages();
            showUploadInterface();
        });
}

/**
 * Drag and drop event handlers
 */
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleDragEnter(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    // Only remove if leaving the drop zone itself
    if (!e.currentTarget.contains(e.relatedTarget)) {
        e.currentTarget.classList.remove('drag-over');
    }
}

function handleDrop(e, processFile) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

function handleFileSelect(e, processFile) {
    const files = e.target.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

/**
 * Process uploaded file
 */
function processFile(file, validateAndLoadGraph) {
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.json')) {
        showError('Please select a JSON file.');
        return;
    }
    
    // Generate cache key from file name, size, and last modified
    const cacheKey = `${file.name}_${file.size}_${file.lastModified}`;
    
    // Check if we have this file cached
    if (graphDataCache.has(cacheKey)) {
        console.log('Using cached graph data for', file.name);
        showLoading('Loading from cache...');
        updateProgress(50);
        
        setTimeout(() => {
            const cachedData = graphDataCache.get(cacheKey);
            validateAndLoadGraph(cachedData, true, cacheKey); // true indicates cached data
        }, 100);
        return;
    }
    
    // Show loading state
    showLoading('Reading file...');
    updateProgress(10);
    
    // Read file
    const reader = new FileReader();
    reader.onprogress = function(e) {
        if (e.lengthComputable) {
            const readProgress = (e.loaded / e.total) * 30; // 30% for reading
            updateProgress(10 + readProgress, 'Reading file...');
        }
    };
    
    reader.onload = function(e) {
        updateProgress(40, 'Parsing JSON...');
        
        // Add small delay to show parsing step
        setTimeout(() => {
            try {
                const jsonData = JSON.parse(e.target.result);
                updateProgress(60, 'Validating data...');
                
                // Add delay to show validation step
                setTimeout(() => {
                    validateAndLoadGraph(jsonData, false, cacheKey);
                }, 200);
                
            } catch (error) {
                showError(`Invalid JSON file: ${error.message}`);
            }
        }, 200);
    };
    
    reader.onerror = function() {
        showError('Failed to read file. Please try again.');
    };
    
    reader.readAsText(file);
}

/**
 * Validate and load graph data
 */
function validateAndLoadGraph(data, fromCache = false, cacheKey = null, updateGraphStatistics, showMainInterface) {
    try {
        if (fromCache) {
            updateProgress(70, 'Loading from cache...');
            updateProgress(95, 'Building visualization...');
        } else {
            updateProgress(70, 'Validating structure...');
            
            // Validate basic structure
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid data structure');
            }
            
            if (!data.metadata || (!data.nodes && !data.graph)) {
                throw new Error('Missing required fields: metadata and nodes (or legacy graph)');
            }
            
            // Validate metadata
            if (!data.metadata.stats || typeof data.metadata.stats !== 'object') {
                throw new Error('Invalid metadata structure');
            }
            
            updateProgress(80, 'Validating graph data...');
        }
        
        console.log('Data structure:', {
            hasNodes: !!data.nodes,
            hasEdges: !!data.edges,
            hasGraph: !!data.graph,
            nodesType: Array.isArray(data.nodes),
            edgesType: Array.isArray(data.edges)
        });
        
        let nodeCount = 0;
        
        if (!fromCache) {
            // Handle new spec format (nodes/edges arrays) or legacy format (graph object)
            if (data.nodes && data.edges) {
                // New spec format validation
                if (!Array.isArray(data.nodes)) {
                    throw new Error('Nodes must be an array');
                }
                if (!Array.isArray(data.edges)) {
                    throw new Error('Edges must be an array');
                }
                
                nodeCount = data.nodes.length;
                if (nodeCount === 0) {
                    throw new Error('Graph is empty - no nodes found');
                }
                
                // Validate each node
                let validatedNodes = 0;
                for (const node of data.nodes) {
                    validateSpecNode(node);
                    validatedNodes++;
                    const nodeProgress = (validatedNodes / nodeCount) * 15;
                    updateProgress(80 + nodeProgress, `Validating nodes... (${validatedNodes}/${nodeCount})`);
                }
            } else {
                // Legacy format validation
                const graph = data.graph;
                if (!graph || typeof graph !== 'object') {
                    throw new Error('Graph must be a non-null object');
                }
                
                nodeCount = Object.keys(graph).length;
                if (nodeCount === 0) {
                    throw new Error('Graph is empty - no files found');
                }
                
                let validatedNodes = 0;
                for (const [filePath, nodeData] of Object.entries(graph)) {
                    if (!nodeData) {
                        throw new Error(`Node data for ${filePath} is null or undefined`);
                    }
                    validateLegacyNode(filePath, nodeData, graph);
                    validatedNodes++;
                    const nodeProgress = (validatedNodes / nodeCount) * 15;
                    updateProgress(80 + nodeProgress, `Validating nodes... (${validatedNodes}/${nodeCount})`);
                }
            }
            
            updateProgress(95, 'Building visualization...');
        } else {
            // For cached data, just get the node count
            nodeCount = data.nodes ? data.nodes.length : Object.keys(data.graph).length;
        }
        
        // Cache the validated data if not from cache
        if (!fromCache && cacheKey) {
            // Limit cache size to prevent memory issues (keep last 5 files)
            if (graphDataCache.size >= 5) {
                const firstKey = graphDataCache.keys().next().value;
                graphDataCache.delete(firstKey);
            }
            graphDataCache.set(cacheKey, data);
            console.log('Cached graph data with key:', cacheKey, `(${graphDataCache.size} files cached)`);
        }
        
        updateProgress(100, 'Complete!');
        
        // Show success message briefly
        setTimeout(() => {
            const itemType = data.nodes ? 'modules' : 'files';
            showSuccess(`Successfully loaded ${nodeCount} ${itemType}!`);
            
            // Show main interface after success message
            setTimeout(() => {
                showMainInterface();
            }, 1500);
        }, 300);
        
        // Update graph statistics
        if (updateGraphStatistics) {
            updateGraphStatistics(data);
        }
        
        return data; // Return the validated data
        
    } catch (error) {
        showError(error.message);
        return null;
    }
}

/**
 * Validate node in new spec format
 */
function validateSpecNode(node) {
    // Check required fields
    if (!node.id || typeof node.id !== 'string') {
        throw new Error(`Node must have a string id, got: ${node.id}`);
    }
    
    if (!node.type || !['app', 'lib', 'external'].includes(node.type)) {
        throw new Error(`Node ${node.id}: type must be 'app', 'lib', or 'external'`);
    }
    
    if (typeof node.linesOfCode !== 'number' || node.linesOfCode < 0) {
        throw new Error(`Node ${node.id}: linesOfCode must be a positive number`);
    }
    
    if (typeof node.fileCount !== 'number' || node.fileCount < 0) {
        throw new Error(`Node ${node.id}: fileCount must be a positive number`);
    }
    
    if (typeof node.incomingCount !== 'number' || node.incomingCount < 0) {
        throw new Error(`Node ${node.id}: incomingCount must be a positive number`);
    }
    
    if (typeof node.outgoingCount !== 'number' || node.outgoingCount < 0) {
        throw new Error(`Node ${node.id}: outgoingCount must be a positive number`);
    }
}

/**
 * Validate node in legacy format
 */
function validateLegacyNode(filePath, nodeData, graph) {
    // Check required fields
    if (!nodeData.hasOwnProperty('imports') || !Array.isArray(nodeData.imports)) {
        throw new Error(`Node ${filePath}: imports must be an array`);
    }
    
    if (!nodeData.hasOwnProperty('importedBy') || !Array.isArray(nodeData.importedBy)) {
        throw new Error(`Node ${filePath}: importedBy must be an array`);
    }
    
    if (!nodeData.hasOwnProperty('linesOfCode') || typeof nodeData.linesOfCode !== 'number' || nodeData.linesOfCode < 0) {
        throw new Error(`Node ${filePath}: linesOfCode must be a positive number`);
    }
    
    // Validate imports exist in graph
    for (const importPath of nodeData.imports) {
        if (!graph.hasOwnProperty(importPath)) {
            console.warn(`Node ${filePath}: imported file ${importPath} not found in graph`);
        }
    }
    
    // Validate importedBy relationships
    for (const importerPath of nodeData.importedBy) {
        if (!graph.hasOwnProperty(importerPath)) {
            console.warn(`Node ${filePath}: importing file ${importerPath} not found in graph`);
        }
    }
}

/**
 * UI state management functions
 */
function showLoading(message = 'Processing file...') {
    hideAllMessages();
    document.getElementById('loading-text').textContent = message;
    document.getElementById('progress-fill').style.width = '0%';
    document.getElementById('progress-text').textContent = '0%';
    loadingMessage.style.display = 'flex';
}

function updateProgress(percentage, message = null) {
    if (message) {
        document.getElementById('loading-text').textContent = message;
    }
    document.getElementById('progress-fill').style.width = percentage + '%';
    document.getElementById('progress-text').textContent = Math.round(percentage) + '%';
}

function showError(message) {
    hideAllMessages();
    errorText.textContent = message;
    errorMessage.style.display = 'flex';
    console.error('Validation error:', message);
}

function showSuccess(message) {
    hideAllMessages();
    successText.textContent = message;
    successMessage.style.display = 'flex';
}

function hideAllMessages() {
    loadingMessage.style.display = 'none';
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
}

function showUploadInterface() {
    uploadSection.style.display = 'block';
    mainLayout.style.display = 'none';
    hideAllMessages();
    // Reset file input
    fileInput.value = '';
}

function showMainInterface() {
    uploadSection.style.display = 'none';
    mainLayout.style.display = 'block';
    
    // Initialize visualization after interface is shown
    if (window.initializeVisualizationWhenReady) {
        window.initializeVisualizationWhenReady();
    }
}

// Export all functions
export {
    // Main processing functions
    loadDefaultGraph,
    processFile,
    validateAndLoadGraph,
    
    // Event handlers
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    
    // Validation functions
    validateSpecNode,
    validateLegacyNode,
    
    // UI management functions
    showLoading,
    updateProgress,
    showError,
    showSuccess,
    hideAllMessages,
    showUploadInterface,
    showMainInterface,
    
    // Cache management
    graphDataCache
};
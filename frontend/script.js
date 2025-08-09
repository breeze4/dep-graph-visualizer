document.addEventListener('DOMContentLoaded', function() {
    console.log('Dependency Graph Visualizer loaded successfully');
    
    // Global variables
    let currentGraphData = null;
    let currentSimulation = null;
    
    // DOM elements
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-btn');
    const loadingMessage = document.getElementById('loading-message');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    const errorText = document.getElementById('error-text');
    const successText = document.getElementById('success-text');
    const uploadSection = document.getElementById('upload-section');
    const mainLayout = document.getElementById('main-layout');
    const newFileBtn = document.getElementById('new-file');
    const resetGraphBtn = document.getElementById('reset-graph');
    
    // Initialize event listeners
    initializeUploadHandlers();
    initializeControlHandlers();
    
    // Auto-load default dependency graph for development
    loadDefaultGraph();
    
    function loadDefaultGraph() {
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
    
    function initializeUploadHandlers() {
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
    
    function initializeControlHandlers() {
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
    
    // Drag and drop event handlers
    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function handleDragEnter(e) {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('drag-over');
    }
    
    function handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        // Only remove if leaving the drop zone itself
        if (!dropZone.contains(e.relatedTarget)) {
            dropZone.classList.remove('drag-over');
        }
    }
    
    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            processFile(files[0]);
        }
    }
    
    function handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            processFile(files[0]);
        }
    }
    
    // File processing
    function processFile(file) {
        // Validate file type
        if (!file.name.toLowerCase().endsWith('.json')) {
            showError('Please select a JSON file.');
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
                        validateAndLoadGraph(jsonData);
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
    
    // JSON validation and graph loading
    function validateAndLoadGraph(data) {
        try {
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
            
            console.log('Data structure:', {
                hasNodes: !!data.nodes,
                hasEdges: !!data.edges,
                hasGraph: !!data.graph,
                nodesType: Array.isArray(data.nodes),
                edgesType: Array.isArray(data.edges)
            });
            
            let nodeCount = 0;
            
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
            
            // If validation passes, load the graph
            currentGraphData = data;
            updateGraphStatistics(data);
            
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
            
        } catch (error) {
            showError(error.message);
        }
    }
    
    // Validation for new spec format
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

    // Validation for legacy format
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
    
    // UI state management
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
        currentGraphData = null;
        // Stop any running simulation
        if (currentSimulation) {
            currentSimulation.stop();
            currentSimulation = null;
        }
    }
    
    function showMainInterface() {
        uploadSection.style.display = 'none';
        mainLayout.style.display = 'block';
        
        // Force layout recalculation
        setTimeout(() => {
            // Initialize D3 visualization after layout settles
            initializeD3Visualization();
        }, 50);
    }
    
    function updateGraphStatistics(data, filteredNodes = null) {
        const stats = data.metadata.stats;
        let appCount = 0;
        let libCount = 0;
        let totalEdges = 0;
        let nodesToCount = [];
        
        // Handle both new spec format and legacy format
        if (data.nodes && data.edges) {
            // New spec format
            nodesToCount = filteredNodes || data.nodes.map(node => node.id);
            
            // Count apps vs libs from nodes
            data.nodes.forEach(node => {
                if (!filteredNodes || filteredNodes.includes(node.id)) {
                    if (node.type === 'app') {
                        appCount++;
                    } else if (node.type === 'lib') {
                        libCount++;
                    }
                }
            });
            
            // Count edges
            totalEdges = data.edges.filter(edge => {
                return (!filteredNodes || (filteredNodes.includes(edge.from) && filteredNodes.includes(edge.to)));
            }).length;
            
        } else {
            // Legacy format
            const graph = data.graph;
            nodesToCount = filteredNodes || Object.keys(graph);
            
            nodesToCount.forEach(filePath => {
                if (filePath.startsWith('apps/')) {
                    appCount++;
                } else if (filePath.startsWith('libs/')) {
                    libCount++;
                }
            });
            
            // Count total edges
            Object.entries(graph).forEach(([filePath, nodeData]) => {
                if (nodesToCount.includes(filePath)) {
                    totalEdges += nodeData.imports.length;
                }
            });
        }
        
        // Update statistics display
        const totalItems = data.nodes ? data.nodes.length : Object.keys(data.graph).length;
        document.getElementById('total-files').textContent = totalItems;
        document.getElementById('total-apps').textContent = appCount;
        document.getElementById('total-libs').textContent = libCount;
        document.getElementById('total-edges').textContent = totalEdges;
        document.getElementById('visible-nodes').textContent = nodesToCount.length;
        
        // Update top files
        if (data.nodes && data.edges) {
            updateTopModules(data, nodesToCount);
        } else {
            updateTopFiles(data.graph, nodesToCount);
        }
    }
    
    function updateTopModules(data, visibleModules) {
        // Create module summary for statistics
        const modules = data.nodes
            .filter(node => !visibleModules || visibleModules.includes(node.id))
            .map(node => ({
                id: node.id,
                name: node.id.split('/').pop(),
                linesOfCode: node.linesOfCode,
                fileCount: node.fileCount,
                incomingCount: node.incomingCount,
                outgoingCount: node.outgoingCount,
                type: node.type
            }));
        
        // Most imported modules (highest incoming count)
        const mostImported = modules
            .sort((a, b) => b.incomingCount - a.incomingCount)
            .slice(0, 5);
        
        // Largest modules (most lines of code)
        const largest = modules
            .sort((a, b) => b.linesOfCode - a.linesOfCode)
            .slice(0, 5);
        
        // Update most imported list
        const importedList = document.getElementById('most-imported');
        if (importedList) {
            importedList.innerHTML = mostImported.map(module => 
                `<li class="list-item">
                    <div class="item-name">${module.name}</div>
                    <div class="item-stats">
                        <span class="stat">${module.incomingCount} deps</span>
                        <span class="stat">${module.linesOfCode} LOC</span>
                    </div>
                </li>`
            ).join('');
        }
        
        // Update largest files list  
        const largestList = document.getElementById('largest-files');
        if (largestList) {
            largestList.innerHTML = largest.map(module =>
                `<li class="list-item">
                    <div class="item-name">${module.name}</div>
                    <div class="item-stats">
                        <span class="stat">${module.linesOfCode} LOC</span>
                        <span class="stat">${module.fileCount} files</span>
                    </div>
                </li>`
            ).join('');
        }
        
        // Update most exports (outgoing dependencies)
        const mostExporting = modules
            .sort((a, b) => b.outgoingCount - a.outgoingCount)
            .slice(0, 5);
            
        const exportsList = document.getElementById('most-exports');
        if (exportsList) {
            exportsList.innerHTML = mostExporting.map(module =>
                `<li class="list-item">
                    <div class="item-name">${module.name}</div>
                    <div class="item-stats">
                        <span class="stat">${module.outgoingCount} imports</span>
                        <span class="stat">${module.type}</span>
                    </div>
                </li>`
            ).join('');
        }
    }
    
    function updateTopFiles(graph, visibleNodes) {
        const nodes = visibleNodes.map(filePath => ({
            path: filePath,
            name: filePath.split('/').pop().replace(/\.(ts|js|tsx|jsx)$/, ''),
            ...graph[filePath],
            importCount: graph[filePath].imports.length,
            exportCount: graph[filePath].importedBy.length
        }));
        
        // Most imported files (files that import the most other files)
        const mostExporting = nodes
            .sort((a, b) => b.importCount - a.importCount)
            .slice(0, 5);
        
        const mostExportsList = document.getElementById('most-exports');
        mostExportsList.innerHTML = '';
        mostExporting.forEach(node => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="file-name">${node.name}</span>
                <span class="file-stat">${node.importCount}</span>
            `;
            li.addEventListener('click', () => highlightNode(node.path));
            mostExportsList.appendChild(li);
        });
        
        // Most imported files (files that are imported by the most other files)
        const mostImported = nodes
            .sort((a, b) => b.exportCount - a.exportCount)
            .slice(0, 5);
        
        const mostImportedList = document.getElementById('most-imported');
        mostImportedList.innerHTML = '';
        mostImported.forEach(node => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="file-name">${node.name}</span>
                <span class="file-stat">${node.exportCount}</span>
            `;
            li.addEventListener('click', () => highlightNode(node.path));
            mostImportedList.appendChild(li);
        });
        
        // Largest files
        const largestFiles = nodes
            .sort((a, b) => b.linesOfCode - a.linesOfCode)
            .slice(0, 5);
        
        const largestFilesList = document.getElementById('largest-files');
        largestFilesList.innerHTML = '';
        largestFiles.forEach(node => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="file-name">${node.name}</span>
                <span class="file-stat">${node.linesOfCode} LOC</span>
            `;
            li.addEventListener('click', () => highlightNode(node.path));
            largestFilesList.appendChild(li);
        });
    }
    
    // D3 visualization variables
    let svg, g, zoom, width, height;
    let nodes, links;
    
    function initializeD3Visualization() {
        const visualization = document.getElementById('visualization');
        visualization.innerHTML = '';
        
        // Get full window dimensions
        width = window.innerWidth;
        height = window.innerHeight;
        
        // Create SVG with D3
        svg = d3.select('#visualization')
            .append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', `0 0 ${width} ${height}`);
        
        // Create zoom behavior
        zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on('zoom', function(event) {
                g.attr('transform', event.transform);
            });
        
        // Apply zoom to SVG
        svg.call(zoom);
        
        // Create main group for all graph elements
        g = svg.append('g')
            .attr('class', 'graph-container');
        
        // Add background rectangle for zoom/pan events and deselection
        g.append('rect')
            .attr('width', width)
            .attr('height', height)
            .attr('fill', 'transparent')
            .attr('pointer-events', 'all')
            .on('click', function(event) {
                // Deselect nodes when clicking empty space
                event.stopPropagation();
                deselectAllNodes();
            });
        
        // Transform graph data and render
        if (currentGraphData) {
            const graphData = transformGraphData(currentGraphData);
            renderGraph(graphData);
        }
    }
    
    function transformGraphData(data) {
        const transformedNodes = [];
        const transformedLinks = [];
        
        // Handle new spec format (nodes/edges arrays) or legacy format (graph object)
        if (data.nodes && data.edges) {
            // New spec format
            data.nodes.forEach(node => {
                const transformedNode = {
                    id: node.id,
                    path: node.id,
                    linesOfCode: node.linesOfCode,
                    fileCount: node.fileCount,
                    incomingCount: node.incomingCount,
                    outgoingCount: node.outgoingCount,
                    type: node.type,
                    isApp: node.type === 'app',
                    isLib: node.type === 'lib',
                    isExternal: node.type === 'external',
                    // Calculate node size based on incoming dependencies (min 8, max 50)
                    size: Math.max(8, Math.min(50, 8 + node.incomingCount * 6)),
                    // Determine color based on type
                    color: node.type === 'app' ? '#3498db' : 
                           node.type === 'lib' ? '#2ecc71' : '#95a5a6',
                    // Short name for display
                    name: node.id.split('/').pop(),
                    // Initialize arrays to be populated from edges
                    imports: [],
                    importedBy: []
                };
                transformedNodes.push(transformedNode);
            });
            
            // Build imports/importedBy arrays from edges
            data.edges.forEach(edge => {
                const sourceNode = transformedNodes.find(n => n.id === edge.from);
                const targetNode = transformedNodes.find(n => n.id === edge.to);
                
                if (sourceNode && targetNode) {
                    sourceNode.imports.push(edge.to);
                    targetNode.importedBy.push(edge.from);
                }
            });
            
            // Transform edges to links
            data.edges.forEach(edge => {
                transformedLinks.push({
                    source: edge.from,
                    target: edge.to,
                    id: `${edge.from}->${edge.to}`,
                    count: edge.count,
                    symbols: edge.symbols,
                    // Calculate thickness based on count (min 1, max 8)
                    thickness: Math.max(1, Math.min(8, edge.count * 2))
                });
            });
        } else {
            // Legacy format
            const graph = data.graph;
            
            // Create nodes array with metadata
            Object.entries(graph).forEach(([filePath, nodeData]) => {
                const node = {
                    id: filePath,
                    path: filePath,
                    linesOfCode: nodeData.linesOfCode,
                    imports: nodeData.imports,
                    importedBy: nodeData.importedBy,
                    incomingCount: nodeData.importedBy ? nodeData.importedBy.length : 0,
                    outgoingCount: nodeData.imports ? nodeData.imports.length : 0,
                    isApp: filePath.startsWith('apps/'),
                    isLib: filePath.startsWith('libs/'),
                    // Calculate node size based on lines of code (min 8, max 50)
                    size: Math.max(8, Math.min(50, nodeData.linesOfCode * 0.8)),
                    // Determine color based on type
                    color: filePath.startsWith('apps/') ? '#3498db' : '#2ecc71',
                    // Short name for display
                    name: filePath.split('/').pop().replace(/\.(ts|js|tsx|jsx)$/, '')
                };
                transformedNodes.push(node);
            });
            
            // Create links array from imports
            Object.entries(graph).forEach(([filePath, nodeData]) => {
                nodeData.imports.forEach(importPath => {
                    // Only create link if target exists in graph
                    if (graph[importPath]) {
                        transformedLinks.push({
                            source: filePath,
                            target: importPath,
                            id: `${filePath}->${importPath}`,
                            count: 1,
                            symbols: [],
                            thickness: 2
                        });
                    }
                });
            });
        }
        
        return {
            nodes: transformedNodes,
            links: transformedLinks
        };
    }
    
    // Calculate edge weight based on source and target connectivity
    function calculateEdgeWeight(link) {
        // Get connectivity metrics
        const sourceImports = link.source.imports ? link.source.imports.length : 0;
        const targetImportedBy = link.target.importedBy ? link.target.importedBy.length : 0;
        
        // Weight formula: considers both how many files the source imports
        // and how many files import the target (importance of connection)
        const weight = (sourceImports * 0.3 + targetImportedBy * 0.7) / 10;
        
        // Return value between 1.5 and 4 pixels for better visibility
        return Math.max(1.5, Math.min(4, 1.5 + weight));
    }
    
    function renderGraph(graphData) {
        nodes = graphData.nodes;
        links = graphData.links;
        
        // Clear existing elements
        g.selectAll('.link').remove();
        g.selectAll('.node').remove();
        
        // Clear existing defs and add new ones
        svg.selectAll('defs').remove();
        const defs = svg.append('defs');
        
        // Add small arrowhead marker for thin edges
        defs.append('marker')
            .attr('id', 'arrowhead-small')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 23) // Slightly closer for small arrows
            .attr('refY', 0)
            .attr('markerWidth', 4)
            .attr('markerHeight', 4)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#99a');
        
        // Add standard arrowhead marker
        defs.append('marker')
            .attr('id', 'arrowhead')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 25) // Adjusted to position at node edge for average node size
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#99a');
        
        // Add large arrowhead marker for thick edges
        defs.append('marker')
            .attr('id', 'arrowhead-large')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 27) // Slightly further for large arrows
            .attr('refY', 0)
            .attr('markerWidth', 8)
            .attr('markerHeight', 8)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#99a');
        
        // Create links (edges) with enhanced styling
        const link = g.append('g')
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
                // Calculate edge weight based on both source and target connectivity
                const edgeWeight = calculateEdgeWeight(d);
                return edgeWeight;
            })
            .attr('fill', 'none')
            .attr('marker-end', d => {
                // Select appropriate arrow marker based on edge weight
                const weight = calculateEdgeWeight(d);
                if (weight <= 1.5) return 'url(#arrowhead-small)';
                else if (weight >= 2.5) return 'url(#arrowhead-large)';
                else return 'url(#arrowhead)';
            })
            .style('cursor', 'pointer')
            .on('mouseenter', function(event, d) {
                // Highlight edge on hover (CSS handles color change)
                d3.select(this)
                    .attr('stroke-opacity', 0.9)
                    .attr('stroke-width', Math.max(3, calculateEdgeWeight(d) * 1.5));
                
                // Show tooltip
                showLinkTooltip(event, d);
            })
            .on('mouseleave', function(event, d) {
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
                hideLinkTooltip();
            });
        
        // Create nodes (circles)
        const node = g.append('g')
            .attr('class', 'nodes')
            .selectAll('.node')
            .data(nodes)
            .enter()
            .append('g')
            .attr('class', 'node');
        
        // Add circles to nodes
        node.append('circle')
            .attr('r', d => d.size)
            .attr('fill', d => d.color)
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .style('cursor', 'pointer');
        
        // Add labels to nodes with enhanced formatting
        node.append('text')
            .text(d => {
                // Truncate long names based on node size
                const maxLength = Math.max(8, Math.min(15, d.size / 3));
                return d.name.length > maxLength ? 
                    d.name.substring(0, maxLength - 2) + '..' : 
                    d.name;
            })
            .attr('dy', d => d.size > 25 ? '0.35em' : `${d.size + 12}px`) // Position based on node size
            .attr('text-anchor', 'middle')
            .attr('font-family', 'Segoe UI, sans-serif')
            .attr('font-size', d => `${Math.max(9, Math.min(12, d.size / 4))}px`) // Dynamic font size
            .attr('fill', d => d.size > 25 ? '#fff' : '#333') // White text for large nodes
            .attr('font-weight', d => d.size > 30 ? 'bold' : 'normal')
            .attr('pointer-events', 'none')
            .attr('class', 'node-label');
        
        // Initialize force simulation with enhanced parameters
        currentSimulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links)
                .id(d => d.id)
                .distance(d => {
                    // Adjust distance based on node sizes
                    const sourceSize = d.source.size || 20;
                    const targetSize = d.target.size || 20;
                    return Math.max(80, (sourceSize + targetSize) * 1.5);
                })
                .strength(0.3)
            )
            .force('charge', d3.forceManyBody()
                .strength(d => {
                    // Stronger repulsion for larger nodes
                    return -200 - (d.size * 5);
                })
                .distanceMax(300)
            )
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide()
                .radius(d => d.size + 8)
                .strength(0.8)
            )
            .force('x', d3.forceX(width / 2).strength(0.05))
            .force('y', d3.forceY(height / 2).strength(0.05))
            .alphaDecay(0.02)
            .velocityDecay(0.3);
        
        // Update positions on each tick with curved paths
        currentSimulation.on('tick', () => {
            link.attr('d', d => {
                const dx = d.target.x - d.source.x;
                const dy = d.target.y - d.source.y;
                const dr = Math.sqrt(dx * dx + dy * dy) * 0.3; // Curve factor
                
                // Calculate curve direction to avoid overlaps
                const sourceIndex = nodes.findIndex(n => n.id === d.source.id);
                const targetIndex = nodes.findIndex(n => n.id === d.target.id);
                const sweep = sourceIndex < targetIndex ? 0 : 1;
                
                return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,${sweep} ${d.target.x},${d.target.y}`;
            });
            
            node.attr('transform', d => `translate(${d.x},${d.y})`);
        });
        
        // Handle label collisions after simulation stabilizes
        currentSimulation.on('end', () => {
            setTimeout(() => {
                handleLabelCollisions();
            }, 100);
        });
        
        // Add drag functionality
        node.call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));
        
        // Add click and hover functionality for nodes
        node.on('click', function(event, d) {
            selectNode(d);
        })
        .on('mouseenter', function(event, d) {
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
            showNodeTooltip(event, d);
        })
        .on('mouseleave', function(event, d) {
            // Reset edge styling
            g.selectAll('.link')
                .attr('stroke-opacity', 0.7)
                .attr('stroke-width', linkData => calculateEdgeWeight(linkData));
            
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
            hideNodeTooltip();
        });
        
        // Drag functions
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
    }
    
    function selectNode(nodeData) {
        // Update info panel with node details
        const fileInfo = document.getElementById('file-info');
        fileInfo.innerHTML = `
            <div class="node-details">
                <h4>${nodeData.name}</h4>
                <p><strong>Path:</strong> ${nodeData.path}</p>
                <p><strong>Lines of Code:</strong> ${nodeData.linesOfCode}</p>
                <p><strong>Type:</strong> ${nodeData.isApp ? 'App' : 'Library'}</p>
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
        `;
        
        // Highlight selected node
        g.selectAll('.node circle')
            .attr('stroke', '#fff')
            .attr('stroke-width', 2);
        
        g.selectAll('.node')
            .filter(d => d.id === nodeData.id)
            .select('circle')
            .attr('stroke', '#e74c3c')
            .attr('stroke-width', 4);
    }
    
    function resetGraphView() {
        if (svg && zoom) {
            svg.transition()
                .duration(750)
                .call(zoom.transform, d3.zoomIdentity);
        }
        
        // Clear selection
        g.selectAll('.node circle')
            .attr('stroke', '#fff')
            .attr('stroke-width', 2);
        
        // Reset info panel
        document.getElementById('file-info').innerHTML = '<p>Select a node to view details</p>';
    }
    
    // Tooltip functions
    function showNodeTooltip(event, nodeData) {
        const tooltip = d3.select('body').append('div')
            .attr('class', 'node-tooltip')
            .style('position', 'absolute')
            .style('background', 'rgba(0, 0, 0, 0.8)')
            .style('color', 'white')
            .style('padding', '8px 12px')
            .style('border-radius', '4px')
            .style('font-size', '12px')
            .style('font-family', 'Segoe UI, sans-serif')
            .style('pointer-events', 'none')
            .style('z-index', '1000')
            .style('opacity', 0);
        
        tooltip.html(`
            <strong>${nodeData.name}</strong><br>
            <span style="color: #bbb;">${nodeData.path}</span><br>
            Lines: ${nodeData.linesOfCode} | 
            Imports: ${nodeData.imports.length} | 
            Used by: ${nodeData.importedBy.length}
        `);
        
        tooltip.transition()
            .duration(200)
            .style('opacity', 1);
        
        updateTooltipPosition(event);
    }
    
    function hideNodeTooltip() {
        d3.selectAll('.node-tooltip').remove();
    }
    
    function showLinkTooltip(event, linkData) {
        const tooltip = d3.select('body').append('div')
            .attr('class', 'link-tooltip')
            .style('position', 'absolute')
            .style('background', 'rgba(0, 0, 0, 0.8)')
            .style('color', 'white')
            .style('padding', '8px 12px')
            .style('border-radius', '4px')
            .style('font-size', '12px')
            .style('font-family', 'Segoe UI, sans-serif')
            .style('pointer-events', 'none')
            .style('z-index', '1000')
            .style('opacity', 0);
        
        const sourceName = linkData.source.name || linkData.source.id.split('/').pop();
        const targetName = linkData.target.name || linkData.target.id.split('/').pop();
        
        tooltip.html(`
            <strong>${sourceName}</strong> imports <strong>${targetName}</strong><br>
            <span style="color: #bbb;">${linkData.source.path} → ${linkData.target.path}</span>
        `);
        
        tooltip.transition()
            .duration(200)
            .style('opacity', 1);
        
        updateTooltipPosition(event);
    }
    
    function hideLinkTooltip() {
        d3.selectAll('.link-tooltip').remove();
    }
    
    function updateTooltipPosition(event) {
        const tooltip = d3.selectAll('.node-tooltip, .link-tooltip');
        if (!tooltip.empty()) {
            const tooltipNode = tooltip.node();
            if (tooltipNode) {
                const tooltipRect = tooltipNode.getBoundingClientRect();
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;
                
                let left = event.pageX + 10;
                let top = event.pageY - 10;
                
                // Handle right edge overflow
                if (left + tooltipRect.width > windowWidth) {
                    left = event.pageX - tooltipRect.width - 10;
                }
                
                // Handle bottom edge overflow
                if (top + tooltipRect.height > windowHeight) {
                    top = event.pageY - tooltipRect.height - 10;
                }
                
                // Handle left edge overflow
                if (left < 0) {
                    left = 10;
                }
                
                // Handle top edge overflow
                if (top < 0) {
                    top = 10;
                }
                
                tooltip
                    .style('left', left + 'px')
                    .style('top', top + 'px');
            }
        }
    }
    
    // Additional control functions
    function toggleNodeLabels() {
        const showLabels = document.getElementById('toggle-labels').checked;
        if (g) {
            g.selectAll('.node-label')
                .style('display', showLabels ? 'block' : 'none');
        }
    }
    
    function deselectAllNodes() {
        if (g) {
            // Reset all node styling
            g.selectAll('.node circle')
                .attr('stroke', '#fff')
                .attr('stroke-width', 2);
            
            // Reset info panel
            document.getElementById('file-info').innerHTML = '<p>Select a node to view details</p>';
        }
    }
    
    // Label collision detection (basic implementation)
    function handleLabelCollisions() {
        if (!g) return;
        
        const labels = g.selectAll('.node-label').nodes();
        const labelData = labels.map(label => {
            const bbox = label.getBBox();
            const transform = d3.select(label.parentNode).attr('transform');
            const translate = transform ? transform.match(/translate\(([^,]+),([^)]+)\)/) : null;
            
            return {
                element: label,
                x: translate ? parseFloat(translate[1]) - bbox.width/2 : 0,
                y: translate ? parseFloat(translate[2]) - bbox.height/2 : 0,
                width: bbox.width,
                height: bbox.height
            };
        });
        
        // Simple collision detection - hide overlapping labels
        for (let i = 0; i < labelData.length; i++) {
            let hasCollision = false;
            for (let j = i + 1; j < labelData.length; j++) {
                const a = labelData[i];
                const b = labelData[j];
                
                if (a.x < b.x + b.width && 
                    a.x + a.width > b.x && 
                    a.y < b.y + b.height && 
                    a.y + a.height > b.y) {
                    hasCollision = true;
                    break;
                }
            }
            
            // Hide labels that would collide (keep larger nodes visible)
            const parentNode = d3.select(labelData[i].element.parentNode);
            const nodeSize = parentNode.datum().size;
            
            if (hasCollision && nodeSize < 20) {
                d3.select(labelData[i].element).style('display', 'none');
            }
        }
    }
    
    // Control functions
    function updateMinLoc() {
        const minLoc = parseInt(document.getElementById('min-loc').value);
        document.getElementById('loc-value').textContent = minLoc;
        applyFilters();
    }
    
    function applyFilters() {
        if (!currentGraphData || !g) return;
        
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
            highlightSearchResults(searchTerm);
        } else {
            clearSearchHighlight();
        }
        
        // Update statistics
        updateGraphStatistics(currentGraphData, filteredNodes);
    }
    
    function highlightSearchResults(searchTerm) {
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
    
    function clearSearchHighlight() {
        g.selectAll('.node circle')
            .attr('stroke', '#fff')
            .attr('stroke-width', 2);
    }
    
    function highlightNode(filePath) {
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
        const nodeData = g.selectAll('.node').data().find(d => d.id === filePath);
        if (nodeData) {
            selectNode(nodeData);
        }
    }
    
    function resetFilters() {
        document.getElementById('show-apps').checked = true;
        document.getElementById('show-libs').checked = true;
        document.getElementById('min-loc').value = 0;
        document.getElementById('loc-value').textContent = '0';
        document.getElementById('search-input').value = '';
        
        applyFilters();
    }
    
    // Utility function for debouncing search input
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
    
    // Collapsible panel functionality
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
    
    // Handle window resize
    function handleWindowResize() {
        if (svg && currentGraphData) {
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
            if (currentSimulation) {
                currentSimulation
                    .force('center', d3.forceCenter(width / 2, height / 2))
                    .force('x', d3.forceX(width / 2).strength(0.05))
                    .force('y', d3.forceY(height / 2).strength(0.05))
                    .alpha(0.3)
                    .restart();
            }
        }
    }
    
    // Add event listeners
    window.addEventListener('resize', debounce(handleWindowResize, 250));
    
    // Update tooltip position on mouse move
    document.addEventListener('mousemove', function(event) {
        updateTooltipPosition(event);
    });
});
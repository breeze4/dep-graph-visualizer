/**
 * Statistics and UI Updates Module
 * Handles graph statistics calculation, UI updates, and state management
 */

import { highlightNode } from './interaction-handlers.ts';

/**
 * Update graph statistics display
 */
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

/**
 * Update top modules display for new spec format
 */
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

/**
 * Update top files display for legacy format
 */
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
    if (mostExportsList) {
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
    }
    
    // Most imported files (files that are imported by the most other files)
    const mostImported = nodes
        .sort((a, b) => b.exportCount - a.exportCount)
        .slice(0, 5);
    
    const mostImportedList = document.getElementById('most-imported');
    if (mostImportedList) {
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
    }
    
    // Largest files
    const largestFiles = nodes
        .sort((a, b) => b.linesOfCode - a.linesOfCode)
        .slice(0, 5);
    
    const largestFilesList = document.getElementById('largest-files');
    if (largestFilesList) {
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
}

/**
 * UI state management functions
 */
function showLoading(message = 'Processing file...') {
    hideAllMessages();
    document.getElementById('loading-text').textContent = message;
    document.getElementById('progress-fill').style.width = '0%';
    document.getElementById('progress-text').textContent = '0%';
    document.getElementById('loading-message').style.display = 'flex';
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
    document.getElementById('error-text').textContent = message;
    document.getElementById('error-message').style.display = 'flex';
    console.error('Validation error:', message);
}

function showSuccess(message) {
    hideAllMessages();
    document.getElementById('success-text').textContent = message;
    document.getElementById('success-message').style.display = 'flex';
}

function hideAllMessages() {
    document.getElementById('loading-message').style.display = 'none';
    document.getElementById('error-message').style.display = 'none';
    document.getElementById('success-message').style.display = 'none';
}

function showUploadInterface() {
    document.getElementById('upload-section').style.display = 'block';
    document.getElementById('main-layout').style.display = 'none';
    hideAllMessages();
    // Reset file input
    const fileInput = document.getElementById('file-input');
    if (fileInput) fileInput.value = '';
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
    
    // Add styles if not already present
    if (!document.querySelector('style[data-perf-indicator]')) {
        const style = document.createElement('style');
        style.setAttribute('data-perf-indicator', 'true');
        style.textContent = `
            .performance-indicator {
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 8px 12px;
                border-radius: 4px;
                font-family: 'Segoe UI', sans-serif;
                font-size: 12px;
                z-index: 10000;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .perf-icon {
                font-size: 14px;
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(indicator);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (indicator.parentNode) {
            indicator.remove();
        }
    }, 5000);
}

/**
 * Show temporary message
 */
function showTemporaryMessage(message, isError = false) {
    // Remove any existing message
    const existing = document.querySelector('.temp-message');
    if (existing) existing.remove();
    
    const messageEl = document.createElement('div');
    messageEl.className = `temp-message ${isError ? 'error' : 'success'}`;
    messageEl.textContent = message;
    
    // Add styles if not already present
    if (!document.querySelector('style[data-temp-message]')) {
        const style = document.createElement('style');
        style.setAttribute('data-temp-message', 'true');
        style.textContent = `
            .temp-message {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                padding: 12px 24px;
                border-radius: 6px;
                font-family: 'Segoe UI', sans-serif;
                font-size: 14px;
                z-index: 10000;
                min-width: 200px;
                text-align: center;
            }
            .temp-message.success {
                background: #2ecc71;
                color: white;
            }
            .temp-message.error {
                background: #e74c3c;
                color: white;
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
        if (messageEl.parentNode) {
            messageEl.remove();
        }
    }, 3000);
}

/**
 * Update multi-select indicator
 */
function updateMultiSelectIndicator(isActive, selectedCount = 0) {
    // Remove any existing indicator
    const existing = document.querySelector('.multi-select-indicator');
    if (existing) existing.remove();
    
    if (isActive) {
        const indicator = document.createElement('div');
        indicator.className = 'multi-select-indicator';
        indicator.innerHTML = `
            <span class="multi-icon">⌘</span>
            <span class="multi-text">Multi-select mode: Click nodes to select multiple</span>
            <span class="multi-count">${selectedCount} selected</span>
        `;
        
        // Add styles if not already present
        if (!document.querySelector('style[data-multi-select]')) {
            const style = document.createElement('style');
            style.setAttribute('data-multi-select', 'true');
            style.textContent = `
                .multi-select-indicator {
                    position: fixed;
                    bottom: 20px;
                    left: 20px;
                    background: rgba(138, 43, 226, 0.9);
                    color: white;
                    padding: 10px 16px;
                    border-radius: 6px;
                    font-family: 'Segoe UI', sans-serif;
                    font-size: 13px;
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    border: 2px solid rgba(138, 43, 226, 0.6);
                }
                .multi-icon {
                    font-size: 16px;
                    font-weight: bold;
                }
                .multi-count {
                    background: rgba(255, 255, 255, 0.2);
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: bold;
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(indicator);
        
        // Update count when selection changes
        const updateCount = (count) => {
            const countSpan = indicator.querySelector('.multi-count');
            if (countSpan) {
                countSpan.textContent = `${count} selected`;
            }
        };
        
        // Store update function for later use
        indicator.updateCount = updateCount;
    }
}

export {
    updateGraphStatistics,
    updateTopModules,
    updateTopFiles,
    showLoading,
    updateProgress,
    showError,
    showSuccess,
    hideAllMessages,
    showUploadInterface,
    showMainInterface,
    showPerformanceIndicator,
    showTemporaryMessage,
    updateMultiSelectIndicator
};
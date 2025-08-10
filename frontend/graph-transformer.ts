/**
 * Graph Data Transformation Module
 * Handles transforming between different graph data formats
 */

// Type definitions for graph data structures
export interface NodeData {
    linesOfCode: number;
    imports: string[];
    importedBy: string[];
}

export interface GraphData {
    [filePath: string]: NodeData;
}

export interface GraphNode {
    id: string;
    path: string;
    linesOfCode: number;
    imports: string[];
    importedBy: string[];
    incomingCount: number;
    outgoingCount: number;
    isApp: boolean;
    isLib: boolean;
    size: number;
    color: string;
    type: string;
}

/**
 * Transform graph data from either new spec format or legacy format into a standardized format for D3
 */
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
        Object.entries(graph).forEach(([filePath, nodeData]: [string, NodeData]) => {
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
        Object.entries(graph).forEach(([filePath, nodeData]: [string, NodeData]) => {
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

/**
 * Calculate edge weight based on source and target connectivity
 */
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

export {
    transformGraphData,
    calculateEdgeWeight
};
/**
 * Tooltip Functionality Module
 * Handles creation, positioning, and management of tooltips for nodes and edges
 */
import * as d3 from 'd3';

/**
 * Show node tooltip
 */
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

/**
 * Hide node tooltip
 */
function hideNodeTooltip() {
    d3.selectAll('.node-tooltip').remove();
}

/**
 * Show link tooltip
 */
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

/**
 * Hide link tooltip
 */
function hideLinkTooltip() {
    d3.selectAll('.link-tooltip').remove();
}

/**
 * Update tooltip position to handle screen edge overflow
 */
function updateTooltipPosition(event) {
    const tooltip = d3.selectAll('.node-tooltip, .link-tooltip');
    if (!tooltip.empty()) {
        const tooltipNode = tooltip.node() as HTMLElement;
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

/**
 * Create enhanced tooltip with more detailed information
 */
function showEnhancedNodeTooltip(event, nodeData) {
    const tooltip = d3.select('body').append('div')
        .attr('class', 'node-tooltip enhanced')
        .style('position', 'absolute')
        .style('background', 'rgba(0, 0, 0, 0.9)')
        .style('color', 'white')
        .style('padding', '12px 16px')
        .style('border-radius', '6px')
        .style('font-size', '12px')
        .style('font-family', 'Segoe UI, sans-serif')
        .style('pointer-events', 'none')
        .style('z-index', '1000')
        .style('opacity', 0)
        .style('max-width', '300px')
        .style('border', '1px solid rgba(255, 255, 255, 0.2)');
    
    const typeDisplay = nodeData.type ? 
        (nodeData.type === 'app' ? 'Application' : 
         nodeData.type === 'lib' ? 'Library' : 'External') :
        (nodeData.isApp ? 'Application' : 'Library');
    
    const fileCountDisplay = nodeData.fileCount ? ` | ${nodeData.fileCount} files` : '';
    
    tooltip.html(`
        <div style="border-bottom: 1px solid rgba(255, 255, 255, 0.2); padding-bottom: 8px; margin-bottom: 8px;">
            <strong style="font-size: 14px;">${nodeData.name}</strong>
            <div style="color: #bbb; font-size: 10px; margin-top: 2px;">${nodeData.path}</div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px;">
            <div><strong>Type:</strong> ${typeDisplay}</div>
            <div><strong>Lines:</strong> ${nodeData.linesOfCode}${fileCountDisplay}</div>
            <div><strong>Imports:</strong> ${nodeData.imports.length}</div>
            <div><strong>Used by:</strong> ${nodeData.importedBy.length}</div>
        </div>
    `);
    
    tooltip.transition()
        .duration(200)
        .style('opacity', 1);
    
    updateTooltipPosition(event);
}

/**
 * Create enhanced link tooltip with symbol information
 */
function showEnhancedLinkTooltip(event, linkData) {
    const tooltip = d3.select('body').append('div')
        .attr('class', 'link-tooltip enhanced')
        .style('position', 'absolute')
        .style('background', 'rgba(0, 0, 0, 0.9)')
        .style('color', 'white')
        .style('padding', '12px 16px')
        .style('border-radius', '6px')
        .style('font-size', '12px')
        .style('font-family', 'Segoe UI, sans-serif')
        .style('pointer-events', 'none')
        .style('z-index', '1000')
        .style('opacity', 0)
        .style('max-width', '350px')
        .style('border', '1px solid rgba(255, 255, 255, 0.2)');
    
    const sourceName = linkData.source.name || linkData.source.id.split('/').pop();
    const targetName = linkData.target.name || linkData.target.id.split('/').pop();
    const importCount = linkData.count || 1;
    
    let symbolsInfo = '';
    if (linkData.symbols && linkData.symbols.length > 0) {
        const displaySymbols = linkData.symbols.slice(0, 5);
        const moreCount = linkData.symbols.length - displaySymbols.length;
        symbolsInfo = `
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255, 255, 255, 0.2);">
                <strong>Symbols:</strong> ${displaySymbols.join(', ')}${moreCount > 0 ? ` (+${moreCount} more)` : ''}
            </div>
        `;
    }
    
    tooltip.html(`
        <div style="border-bottom: 1px solid rgba(255, 255, 255, 0.2); padding-bottom: 8px; margin-bottom: 8px;">
            <strong>${sourceName}</strong> imports <strong>${targetName}</strong>
        </div>
        <div style="font-size: 11px; color: #ccc; margin-bottom: 8px;">
            ${linkData.source.path}<br>
            <span style="margin-left: 10px;">↓</span><br>
            ${linkData.target.path}
        </div>
        <div style="font-size: 11px;">
            <strong>Import count:</strong> ${importCount}
        </div>
        ${symbolsInfo}
    `);
    
    tooltip.transition()
        .duration(200)
        .style('opacity', 1);
    
    updateTooltipPosition(event);
}

/**
 * Remove all tooltips
 */
function removeAllTooltips() {
    d3.selectAll('.node-tooltip, .link-tooltip').remove();
}

/**
 * Create tooltip factory for different tooltip types
 */
function createTooltipFactory(enhanced = false) {
    return {
        showNodeTooltip: enhanced ? showEnhancedNodeTooltip : showNodeTooltip,
        hideNodeTooltip: hideNodeTooltip,
        showLinkTooltip: enhanced ? showEnhancedLinkTooltip : showLinkTooltip,
        hideLinkTooltip: hideLinkTooltip,
        updateTooltipPosition: updateTooltipPosition,
        removeAllTooltips: removeAllTooltips
    };
}

export {
    showNodeTooltip,
    hideNodeTooltip,
    showLinkTooltip,
    hideLinkTooltip,
    updateTooltipPosition,
    showEnhancedNodeTooltip,
    showEnhancedLinkTooltip,
    removeAllTooltips,
    createTooltipFactory
};
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dependency Graph Visualizer loaded successfully');
    
    // Initialize visualization container
    const visualizationElement = document.getElementById('visualization');
    const loadDataBtn = document.getElementById('loadData');
    
    // Set up D3 SVG
    const svg = d3.select('#visualization')
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%');
    
    // Handle load data button click
    loadDataBtn.addEventListener('click', async function() {
        console.log('Loading dependency data...');
        
        try {
            const response = await fetch('/api/dependencies');
            const data = await response.json();
            console.log('Dependency data loaded:', data);
            
            // Placeholder for future visualization logic
            svg.append('text')
                .attr('x', '50%')
                .attr('y', '50%')
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'middle')
                .style('font-size', '18px')
                .style('fill', '#666')
                .text('Dependency visualization will appear here');
                
        } catch (error) {
            console.error('Error loading dependencies:', error);
            alert('Failed to load dependency data');
        }
    });
});
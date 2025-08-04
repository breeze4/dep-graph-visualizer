document.addEventListener('DOMContentLoaded', function() {
    const demoBtn = document.getElementById('demo-btn');
    
    demoBtn.addEventListener('click', function() {
        alert('Hello from the Dependency Graph Visualizer!');
        console.log('Demo button clicked');
    });
    
    console.log('Dependency Graph Visualizer loaded successfully');
});
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
    console.error('Error: Please provide a directory path to analyze');
    console.error('Usage: node graph-main.js <directory-path>');
    process.exit(1);
}

const targetDirectory = args[0];
const absolutePath = path.resolve(targetDirectory);

// Validate directory exists
if (!fs.existsSync(absolutePath)) {
    console.error(`Error: Directory does not exist: ${absolutePath}`);
    process.exit(1);
}

if (!fs.statSync(absolutePath).isDirectory()) {
    console.error(`Error: Path is not a directory: ${absolutePath}`);
    process.exit(1);
}

console.log('Dependency Graph Analyzer');
console.log('========================');
console.log(`Analyzing directory: ${absolutePath}`);
console.log('');

// Main analysis function
function analyzeDirectory(dirPath) {
    console.log('Starting analysis...');
    
    // TODO: Implement apps/libs detection
    // TODO: Implement dependency traversal
    // TODO: Build dependency graph data structure
    
    console.log('Analysis complete!');
}

// Run the analysis
analyzeDirectory(absolutePath);
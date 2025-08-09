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

// Check if file is a JavaScript/TypeScript file
function isJsOrTsFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'].includes(ext);
}

// Check if file is a test file
function isTestFile(filePath) {
    const basename = path.basename(filePath).toLowerCase();
    return basename.includes('.test.') || 
           basename.includes('.spec.') || 
           basename.includes('_test.') ||
           basename.includes('_spec.') ||
           filePath.includes('__tests__/') ||
           filePath.includes('/test/') ||
           filePath.includes('/tests/');
}

// Recursively traverse directory and collect files
function traverseDirectory(dirPath, baseDir = dirPath, files = []) {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            // Skip node_modules and other common directories
            if (['node_modules', '.git', 'dist', 'build', 'coverage', '.next'].includes(item)) {
                continue;
            }
            traverseDirectory(fullPath, baseDir, files);
        } else if (stat.isFile() && isJsOrTsFile(fullPath)) {
            const relativePath = path.relative(baseDir, fullPath);
            files.push({
                absolutePath: fullPath,
                relativePath: relativePath,
                isTest: isTestFile(fullPath)
            });
        }
    }
    
    return files;
}

// Count lines in a file
function countLines(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.split('\n').length;
}

// Parse imports from a JavaScript/TypeScript file
function parseImports(filePath, projectRoot) {
    const content = fs.readFileSync(filePath, 'utf8');
    const imports = [];
    
    // Regular expressions for different import styles
    const importPatterns = [
        // ES6 imports: import ... from './path'
        /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g,
        // CommonJS requires: require('./path')
        /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
        // Dynamic imports: import('./path')
        /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g
    ];
    
    for (const pattern of importPatterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
            const importPath = match[1];
            
            // Only process relative imports (internal to project)
            if (importPath.startsWith('.') || importPath.startsWith('/')) {
                imports.push(importPath);
            }
        }
    }
    
    // Resolve import paths to actual file paths
    const resolvedImports = [];
    const fileDir = path.dirname(filePath);
    
    for (const importPath of imports) {
        let resolvedPath = path.resolve(fileDir, importPath);
        
        // Try different extensions if none specified
        if (!path.extname(resolvedPath)) {
            const extensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'];
            for (const ext of extensions) {
                if (fs.existsSync(resolvedPath + ext)) {
                    resolvedPath = resolvedPath + ext;
                    break;
                }
            }
            // Also check for index files
            const indexPath = path.join(resolvedPath, 'index');
            for (const ext of extensions) {
                if (fs.existsSync(indexPath + ext)) {
                    resolvedPath = indexPath + ext;
                    break;
                }
            }
        }
        
        // Convert to relative path from project root
        if (fs.existsSync(resolvedPath)) {
            const relativePath = path.relative(projectRoot, resolvedPath);
            resolvedImports.push(relativePath);
        }
    }
    
    return resolvedImports;
}

// Build dependency graph from files
function buildDependencyGraph(files, projectRoot) {
    const graph = {};
    
    // Initialize graph nodes with LOC data
    for (const file of files) {
        if (!file.isTest) {  // Only analyze non-test files for dependencies
            const linesOfCode = countLines(file.absolutePath);
            graph[file.relativePath] = {
                imports: [],
                importedBy: [],
                linesOfCode: linesOfCode,
                isTest: false
            };
        }
    }
    
    // Parse imports and build graph
    let processedCount = 0;
    for (const file of files) {
        if (!file.isTest) {  // Only analyze non-test files for dependencies
            processedCount++;
            if (processedCount % 10 === 0) {
                console.log(`  Processing file ${processedCount}/${files.filter(f => !f.isTest).length}...`);
            }
            
            const imports = parseImports(file.absolutePath, projectRoot);
            
            // Update imports for current file
            graph[file.relativePath].imports = imports;
            
            // Update importedBy for imported files
            for (const importPath of imports) {
                if (graph[importPath]) {
                    graph[importPath].importedBy.push(file.relativePath);
                }
            }
        }
    }
    
    return graph;
}

// Main analysis function
function analyzeDirectory(dirPath) {
    console.log('Starting analysis...\n');
    
    // Check for apps and libs directories
    const appsDir = path.join(dirPath, 'apps');
    const libsDir = path.join(dirPath, 'libs');
    
    if (!fs.existsSync(appsDir) || !fs.existsSync(libsDir)) {
        console.error('Error: Both "apps" and "libs" directories must exist in the target directory');
        console.error(`Expected structure:`);
        console.error(`  ${dirPath}/`);
        console.error(`    ├── apps/`);
        console.error(`    └── libs/`);
        process.exit(1);
    }
    
    console.log('✓ Found apps and libs directories');
    
    // Traverse apps directory
    console.log('\nTraversing apps directory...');
    const appFiles = traverseDirectory(appsDir, dirPath);
    console.log(`  Found ${appFiles.length} JS/TS files in apps`);
    
    // Traverse libs directory
    console.log('\nTraversing libs directory...');
    const libFiles = traverseDirectory(libsDir, dirPath);
    console.log(`  Found ${libFiles.length} JS/TS files in libs`);
    
    const allFiles = [...appFiles, ...libFiles];
    console.log(`\nTotal files to analyze: ${allFiles.length}`);
    
    // Build dependency graph
    console.log('\nBuilding dependency graph...');
    const graph = buildDependencyGraph(allFiles, dirPath);
    
    // Count lines of code
    console.log('\nCounting lines of code...');
    let totalCodeLines = 0;
    let totalTestLines = 0;
    
    for (const file of allFiles) {
        const lines = countLines(file.absolutePath);
        if (file.isTest) {
            totalTestLines += lines;
        } else {
            totalCodeLines += lines;
        }
    }
    
    console.log(`  Total code lines: ${totalCodeLines}`);
    console.log(`  Total test lines: ${totalTestLines}`);
    
    // Generate output
    const outputPath = path.join(dirPath, 'dependency-graph.json');
    const output = {
        metadata: {
            generatedAt: new Date().toISOString(),
            projectRoot: dirPath,
            stats: {
                totalFiles: allFiles.length,
                codeFiles: allFiles.filter(f => !f.isTest).length,
                testFiles: allFiles.filter(f => f.isTest).length,
                totalCodeLines,
                totalTestLines
            }
        },
        graph: graph
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`\n✓ Graph data written to: ${outputPath}`);
    
    console.log('\nAnalysis complete!');
}

// Run the analysis
analyzeDirectory(absolutePath);
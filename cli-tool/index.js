#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Project, SyntaxKind } = require('ts-morph');

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
    console.error('Error: Please provide both app and libs directory paths');
    console.error('Usage: node index.js <app-dir> <libs-dir>');
    console.error('Example: node index.js ./example/example-app/src/apps ./example/example-app/src/libs');
    process.exit(1);
}

const appDirectory = args[0];
const libsDirectory = args[1];
const appPath = path.resolve(appDirectory);
const libsPath = path.resolve(libsDirectory);

// Validate directories exist
if (!fs.existsSync(appPath)) {
    console.error(`Error: App directory does not exist: ${appPath}`);
    process.exit(1);
}

if (!fs.statSync(appPath).isDirectory()) {
    console.error(`Error: App path is not a directory: ${appPath}`);
    process.exit(1);
}

if (!fs.existsSync(libsPath)) {
    console.error(`Error: Libs directory does not exist: ${libsPath}`);
    process.exit(1);
}

if (!fs.statSync(libsPath).isDirectory()) {
    console.error(`Error: Libs path is not a directory: ${libsPath}`);
    process.exit(1);
}

console.log('Dependency Graph Analyzer');
console.log('========================');
console.log(`App directory:  ${appPath}`);
console.log(`Libs directory: ${libsPath}`);
console.log('');

// Detect modules by directory boundaries
function detectModules(files, appDir, libsDir) {
    const modules = new Map();
    
    for (const file of files) {
        if (file.isTest) continue; // Skip test files
        
        const filePath = file.absolutePath;
        let moduleId = null;
        let moduleType = null;
        
        // Determine if file is in app or libs directory
        if (filePath.startsWith(appDir)) {
            moduleType = 'app';
            const relativePath = path.relative(appDir, filePath);
            const pathParts = relativePath.split(path.sep);
            
            // If file is directly in apps root (like main.ts), treat as root app module
            if (pathParts.length === 1) {
                moduleId = `apps/${path.basename(pathParts[0], path.extname(pathParts[0]))}`;
            } else {
                // Use first directory as module (like dashboard, user-profile)
                moduleId = `apps/${pathParts[0]}`;
            }
        } else if (filePath.startsWith(libsDir)) {
            moduleType = 'lib';
            const relativePath = path.relative(libsDir, filePath);
            const pathParts = relativePath.split(path.sep);
            
            // For libs, if file is directly in libs root, use filename as module
            if (pathParts.length === 1) {
                moduleId = `libs/${path.basename(pathParts[0], path.extname(pathParts[0]))}`;
            } else {
                // Use first directory as module
                moduleId = `libs/${pathParts[0]}`;
            }
        }
        
        if (moduleId) {
            if (!modules.has(moduleId)) {
                modules.set(moduleId, {
                    id: moduleId,
                    type: moduleType,
                    files: [],
                    linesOfCode: 0,
                    fileCount: 0
                });
            }
            
            const module = modules.get(moduleId);
            module.files.push(file);
            module.linesOfCode += countLines(file.absolutePath);
            module.fileCount++;
        }
    }
    
    return modules;
}

// Build module-level dependency graph
function buildModuleDependencyGraph(project, modules, files, projectRoot, appDir, libsDir) {
    console.log('Building module-level dependencies...');
    
    // First, create a mapping from file paths to module IDs
    const fileToModuleMap = new Map();
    
    for (const [moduleId, module] of modules) {
        for (const file of module.files) {
            const relativePath = path.relative(projectRoot, file.absolutePath);
            fileToModuleMap.set(relativePath, moduleId);
        }
    }
    
    // Track dependencies between modules
    const moduleDependencies = new Map();
    
    // Initialize module dependency tracking
    for (const [moduleId] of modules) {
        moduleDependencies.set(moduleId, {
            imports: new Set(),
            importedBy: new Set(),
            importDetails: new Map() // moduleId -> { symbols: [], count: number }
        });
    }
    
    // Process each file's imports to build module dependencies
    let processedFiles = 0;
    const totalFiles = files.filter(f => !f.isTest).length;
    
    for (const file of files) {
        if (file.isTest) continue;
        
        processedFiles++;
        if (processedFiles % 5 === 0 || processedFiles === totalFiles) {
            const percentage = Math.round((processedFiles / totalFiles) * 100);
            console.log(`  Processing module dependencies: ${processedFiles}/${totalFiles} (${percentage}%)...`);
        }
        
        const fileRelativePath = path.relative(projectRoot, file.absolutePath);
        const sourceModuleId = fileToModuleMap.get(fileRelativePath);
        
        if (!sourceModuleId) continue;
        
        // Parse imports for this file
        const imports = parseImportsWithTsMorph(project, file.absolutePath, projectRoot);
        
        for (const importInfo of imports) {
            const targetModuleId = fileToModuleMap.get(importInfo.path);
            
            if (targetModuleId && targetModuleId !== sourceModuleId) {
                // Add module-level dependency
                moduleDependencies.get(sourceModuleId).imports.add(targetModuleId);
                moduleDependencies.get(targetModuleId).importedBy.add(sourceModuleId);
                
                // Track detailed import information at module level
                const sourceModuleDeps = moduleDependencies.get(sourceModuleId);
                if (!sourceModuleDeps.importDetails.has(targetModuleId)) {
                    sourceModuleDeps.importDetails.set(targetModuleId, {
                        symbols: new Set(),
                        count: 0
                    });
                }
                
                const importDetail = sourceModuleDeps.importDetails.get(targetModuleId);
                importDetail.count++;
                
                // Add symbols
                for (const symbol of importInfo.symbols) {
                    importDetail.symbols.add(symbol.name);
                }
            }
        }
    }
    
    return moduleDependencies;
}

// Initialize ts-morph project
function initializeTsMorphProject(appDir, libsDir) {
    console.log('Initializing TypeScript project...');
    
    // Find tsconfig.json - look in parent directories
    let tsconfigPath = null;
    let searchDir = path.dirname(appDir);
    
    // Search up the directory tree for tsconfig.json
    for (let i = 0; i < 5; i++) { // Limit search depth
        const candidate = path.join(searchDir, 'tsconfig.json');
        if (fs.existsSync(candidate)) {
            tsconfigPath = candidate;
            break;
        }
        searchDir = path.dirname(searchDir);
    }
    
    if (tsconfigPath) {
        console.log(`  Found tsconfig.json at: ${tsconfigPath}`);
    } else {
        console.log('  No tsconfig.json found, using default TypeScript configuration');
    }
    
    // Create ts-morph project
    const project = new Project({
        tsConfigFilePath: tsconfigPath,
        skipAddingFilesFromTsConfig: true, // We'll add files manually
        skipFileDependencyResolution: false,
        skipLoadingLibFiles: true // Skip lib files for performance
    });
    
    return project;
}

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
function traverseDirectory(dirPath, baseDir = dirPath, files = [], showProgress = true) {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            // Skip node_modules and other common directories
            if (['node_modules', '.git', 'dist', 'build', 'coverage', '.next'].includes(item)) {
                continue;
            }
            traverseDirectory(fullPath, baseDir, files, false);
        } else if (stat.isFile() && isJsOrTsFile(fullPath)) {
            const relativePath = path.relative(baseDir, fullPath);
            files.push({
                absolutePath: fullPath,
                relativePath: relativePath,
                isTest: isTestFile(fullPath)
            });
            // Show progress dots during traversal
            if (showProgress && files.length % 20 === 0) {
                process.stdout.write('.');
            }
        }
    }
    
    if (showProgress && files.length > 0) {
        process.stdout.write('\n');
    }
    
    return files;
}

// Count lines in a file
function countLines(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.split('\n').length;
}

// Parse imports from a JavaScript/TypeScript file using ts-morph AST
function parseImportsWithTsMorph(project, filePath, projectRoot) {
    const imports = [];
    
    try {
        // Add the source file to the project if not already added
        const sourceFile = project.addSourceFileAtPathIfExists(filePath) || 
                          project.addSourceFileAtPath(filePath);
        
        // Get all import declarations
        const importDeclarations = sourceFile.getImportDeclarations();
        
        for (const importDecl of importDeclarations) {
            const moduleSpecifier = importDecl.getModuleSpecifierValue();
            
            // Only process relative imports (internal to project)
            if (moduleSpecifier.startsWith('.') || moduleSpecifier.startsWith('/')) {
                const importInfo = {
                    path: moduleSpecifier,
                    symbols: [],
                    isTypeOnly: importDecl.isTypeOnly()
                };
                
                // Extract imported symbols
                const namedImports = importDecl.getNamedImports();
                for (const namedImport of namedImports) {
                    importInfo.symbols.push({
                        name: namedImport.getName(),
                        alias: namedImport.getAliasNode()?.getText(),
                        isTypeOnly: namedImport.isTypeOnly()
                    });
                }
                
                // Extract default import
                const defaultImport = importDecl.getDefaultImport();
                if (defaultImport) {
                    importInfo.symbols.push({
                        name: 'default',
                        alias: defaultImport.getText(),
                        isTypeOnly: false
                    });
                }
                
                // Extract namespace import
                const namespaceImport = importDecl.getNamespaceImport();
                if (namespaceImport) {
                    importInfo.symbols.push({
                        name: '*',
                        alias: namespaceImport.getText(),
                        isTypeOnly: false
                    });
                }
                
                imports.push(importInfo);
            }
        }
        
        // Also check for require() calls in CommonJS style
        const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
            
        for (const callExpr of callExpressions) {
            const expression = callExpr.getExpression();
            if (expression.getText() === 'require') {
                const args = callExpr.getArguments();
                if (args.length > 0) {
                    const firstArg = args[0];
                    if (firstArg.getKind() === SyntaxKind.StringLiteral) {
                        const moduleSpecifier = firstArg.getLiteralValue();
                        if (typeof moduleSpecifier === 'string' && 
                            (moduleSpecifier.startsWith('.') || moduleSpecifier.startsWith('/'))) {
                            imports.push({
                                path: moduleSpecifier,
                                symbols: [{ name: 'default', alias: null, isTypeOnly: false }],
                                isTypeOnly: false
                            });
                        }
                    }
                }
            }
        }
        
    } catch (error) {
        console.warn(`Warning: Failed to parse ${filePath} with ts-morph:`, error.message);
        // Fall back to the original regex parsing for this file
        return parseImportsRegexFallback(filePath, projectRoot);
    }
    
    // Resolve import paths to actual file paths using ts-morph's resolution
    const resolvedImports = [];
    const fileDir = path.dirname(filePath);
    
    for (const importInfo of imports) {
        let resolvedPath = null;
        
        try {
            // Try to use ts-morph's module resolution first
            const moduleResolution = sourceFile.getReferencedSourceFiles()
                .find(ref => {
                    const refPath = ref.getFilePath();
                    const moduleSpec = importInfo.path;
                    return refPath.includes(moduleSpec.replace('./', '').replace('../', ''));
                });
                
            if (moduleResolution) {
                resolvedPath = moduleResolution.getFilePath();
            }
        } catch (error) {
            // Fall back to manual resolution
        }
        
        // Manual resolution as fallback
        if (!resolvedPath) {
            resolvedPath = resolveImportPath(importInfo.path, fileDir);
        }
        
        if (resolvedPath && fs.existsSync(resolvedPath)) {
            const relativePath = path.relative(projectRoot, resolvedPath);
            resolvedImports.push({
                path: relativePath,
                symbols: importInfo.symbols,
                isTypeOnly: importInfo.isTypeOnly
            });
        }
    }
    
    return resolvedImports;
}

// Helper function to resolve import paths
function resolveImportPath(importPath, fileDir) {
    let resolvedPath = path.resolve(fileDir, importPath);
    
    // Try different extensions if none specified
    if (!path.extname(resolvedPath)) {
        const extensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'];
        for (const ext of extensions) {
            if (fs.existsSync(resolvedPath + ext)) {
                return resolvedPath + ext;
            }
        }
        // Also check for index files
        const indexPath = path.join(resolvedPath, 'index');
        for (const ext of extensions) {
            if (fs.existsSync(indexPath + ext)) {
                return indexPath + ext;
            }
        }
    }
    
    return fs.existsSync(resolvedPath) ? resolvedPath : null;
}

// Fallback regex parsing (simplified version of original)
function parseImportsRegexFallback(filePath, projectRoot) {
    const content = fs.readFileSync(filePath, 'utf8');
    const imports = [];
    
    // Simple regex for import statements
    const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g;
    const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    
    let match;
    while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        if (importPath.startsWith('.') || importPath.startsWith('/')) {
            imports.push({ path: importPath, symbols: [], isTypeOnly: false });
        }
    }
    
    while ((match = requireRegex.exec(content)) !== null) {
        const importPath = match[1];
        if (importPath.startsWith('.') || importPath.startsWith('/')) {
            imports.push({ path: importPath, symbols: [], isTypeOnly: false });
        }
    }
    
    // Resolve import paths
    const resolvedImports = [];
    const fileDir = path.dirname(filePath);
    
    for (const importInfo of imports) {
        const resolvedPath = resolveImportPath(importInfo.path, fileDir);
        if (resolvedPath && fs.existsSync(resolvedPath)) {
            const relativePath = path.relative(projectRoot, resolvedPath);
            resolvedImports.push({
                path: relativePath,
                symbols: importInfo.symbols,
                isTypeOnly: importInfo.isTypeOnly
            });
        }
    }
    
    return resolvedImports;
}

// Build dependency graph from files
function buildDependencyGraph(project, files, projectRoot) {
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
    const totalNonTestFiles = files.filter(f => !f.isTest).length;
    for (const file of files) {
        if (!file.isTest) {  // Only analyze non-test files for dependencies
            processedCount++;
            // Show progress every 10 files or at the end
            if (processedCount % 10 === 0 || processedCount === totalNonTestFiles) {
                const percentage = Math.round((processedCount / totalNonTestFiles) * 100);
                console.log(`  Processing files: ${processedCount}/${totalNonTestFiles} (${percentage}%)...`);
            }
            
            const imports = parseImportsWithTsMorph(project, file.absolutePath, projectRoot);
            
            // Update imports for current file - extract just paths for backward compatibility
            const importPaths = imports.map(imp => imp.path);
            graph[file.relativePath].imports = importPaths;
            graph[file.relativePath].importDetails = imports; // Store full import details
            
            // Update importedBy for imported files
            for (const importPath of importPaths) {
                if (graph[importPath]) {
                    graph[importPath].importedBy.push(file.relativePath);
                }
            }
        }
    }
    
    return graph;
}

// Main analysis function
function analyzeDirectories(appDir, libsDir) {
    console.log('Starting analysis...\n');
    
    // Initialize ts-morph project
    const project = initializeTsMorphProject(appDir, libsDir);
    
    // Determine common base path for relative paths
    const commonBase = path.dirname(path.commonBase ? path.commonBase([appDir, libsDir]) : appDir);
    
    // Traverse apps directory
    console.log('Traversing app directory...');
    const appFiles = traverseDirectory(appDir, commonBase);
    console.log(`  Found ${appFiles.length} JS/TS files in app`);
    
    // Traverse libs directory
    console.log('\nTraversing libs directory...');
    const libFiles = traverseDirectory(libsDir, commonBase);
    console.log(`  Found ${libFiles.length} JS/TS files in libs`);
    
    const allFiles = [...appFiles, ...libFiles];
    console.log(`\nTotal files to analyze: ${allFiles.length}`);
    
    // Detect modules by directory boundaries
    console.log('\nDetecting modules...');
    const modules = detectModules(allFiles, appDir, libsDir);
    console.log(`  Found ${modules.size} modules:`);
    for (const [moduleId, module] of modules) {
        console.log(`    ${moduleId} (${module.type}): ${module.fileCount} files, ${module.linesOfCode} LOC`);
    }
    
    // Build module-level dependency graph
    console.log('\nBuilding module-level dependency graph...');
    const moduleDependencies = buildModuleDependencyGraph(project, modules, allFiles, commonBase, appDir, libsDir);
    
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
    
    // Generate output - write to frontend directory
    const outputPath = path.join(__dirname, '..', 'frontend', 'dependency-graph.json');
    
    // Convert modules to the interim format (still keeping old structure for now)
    const moduleGraph = {};
    
    for (const [moduleId, module] of modules) {
        const deps = moduleDependencies.get(moduleId);
        moduleGraph[moduleId] = {
            id: moduleId,
            type: module.type,
            linesOfCode: module.linesOfCode,
            fileCount: module.fileCount,
            imports: Array.from(deps.imports),
            importedBy: Array.from(deps.importedBy),
            importDetails: Array.from(deps.importDetails.entries()).map(([targetId, detail]) => ({
                module: targetId,
                symbols: Array.from(detail.symbols),
                count: detail.count
            }))
        };
    }
    
    // Count apps and libs
    const appModules = Array.from(modules.values()).filter(m => m.type === 'app').length;
    const libModules = Array.from(modules.values()).filter(m => m.type === 'lib').length;
    
    const output = {
        metadata: {
            generatedAt: new Date().toISOString(),
            projectRoot: commonBase,
            appDirectory: appDir,
            libsDirectory: libsDir,
            stats: {
                totalFiles: allFiles.length,
                codeFiles: allFiles.filter(f => !f.isTest).length,
                testFiles: allFiles.filter(f => f.isTest).length,
                totalCodeLines,
                totalTestLines,
                apps: appModules,
                libs: libModules,
                totalModules: modules.size
            }
        },
        modules: moduleGraph
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`\n✓ Graph data written to: ${outputPath}`);
    
    console.log('\nAnalysis complete!');
}

// Run the analysis
analyzeDirectories(appPath, libsPath);
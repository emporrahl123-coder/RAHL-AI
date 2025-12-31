const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class AssetManager {
    constructor() {
        this.baseDir = path.join(__dirname, '../assets');
        this.metadataFile = path.join(this.baseDir, 'metadata/assets.json');
        this.initStorage();
    }
    
    initStorage() {
        // Create asset directories
        const directories = [
            'videos', 'images', 'audio', 'documents', 'projects',
            'templates', 'exports', 'tmp', 'metadata'
        ];
        
        directories.forEach(dir => {
            const dirPath = path.join(this.baseDir, dir);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }
        });
        
        // Initialize metadata file
        if (!fs.existsSync(this.metadataFile)) {
            fs.writeFileSync(this.metadataFile, JSON.stringify({ assets: [] }, null, 2));
        }
        
        console.log('✅ Asset storage initialized');
    }
    
    storeAsset(fileBuffer, assetType, metadata = {}) {
        const assetId = crypto.randomBytes(16).toString('hex');
        const timestamp = Date.now();
        const extension = this.getExtension(assetType, metadata.mimeType);
        const filename = `${assetType}_${timestamp}_${assetId}${extension}`;
        const filePath = path.join(this.baseDir, assetType, filename);
        const relativePath = `/${assetType}/${filename}`;
        
        // Save file
        fs.writeFileSync(filePath, fileBuffer);
        
        // Create metadata record
        const assetRecord = {
            assetId,
            filename,
            filePath: relativePath,
            assetType,
            mimeType: metadata.mimeType || this.getMimeType(extension),
            size: fileBuffer.length,
            createdAt: new Date().toISOString(),
            tags: metadata.tags || [],
            description: metadata.description || '',
            source: metadata.source || 'generated',
            dimensions: metadata.dimensions || null,
            duration: metadata.duration || null,
            isPublic: metadata.isPublic !== false,
            accessCount: 0,
            lastAccessed: null
        };
        
        // Save metadata
        this.saveMetadata(assetRecord);
        
        return {
            success: true,
            assetId,
            url: `/assets${relativePath}`,
            downloadUrl: `/api/assets/download/${assetId}`,
            metadata: assetRecord
        };
    }
    
    saveMetadata(assetRecord) {
        const metadata = JSON.parse(fs.readFileSync(this.metadataFile, 'utf8'));
        metadata.assets.push(assetRecord);
        fs.writeFileSync(this.metadataFile, JSON.stringify(metadata, null, 2));
    }
    
    getAsset(assetId) {
        const metadata = JSON.parse(fs.readFileSync(this.metadataFile, 'utf8'));
        const asset = metadata.assets.find(a => a.assetId === assetId);
        
        if (!asset) {
            return null;
        }
        
        // Update access stats
        asset.accessCount += 1;
        asset.lastAccessed = new Date().toISOString();
        this.updateMetadata(asset);
        
        const fullPath = path.join(this.baseDir, asset.assetType, asset.filename);
        
        if (!fs.existsSync(fullPath)) {
            return null;
        }
        
        return {
            buffer: fs.readFileSync(fullPath),
            metadata: asset
        };
    }
    
    updateMetadata(updatedAsset) {
        const metadata = JSON.parse(fs.readFileSync(this.metadataFile, 'utf8'));
        const index = metadata.assets.findIndex(a => a.assetId === updatedAsset.assetId);
        if (index !== -1) {
            metadata.assets[index] = updatedAsset;
            fs.writeFileSync(this.metadataFile, JSON.stringify(metadata, null, 2));
        }
    }
    
    deleteAsset(assetId) {
        const metadata = JSON.parse(fs.readFileSync(this.metadataFile, 'utf8'));
        const assetIndex = metadata.assets.findIndex(a => a.assetId === assetId);
        
        if (assetIndex === -1) {
            return { success: false, error: 'Asset not found' };
        }
        
        const asset = metadata.assets[assetIndex];
        const filePath = path.join(this.baseDir, asset.assetType, asset.filename);
        
        // Delete file
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        
        // Remove from metadata
        metadata.assets.splice(assetIndex, 1);
        fs.writeFileSync(this.metadataFile, JSON.stringify(metadata, null, 2));
        
        return { success: true, assetId };
    }
    
    searchAssets(query) {
        const metadata = JSON.parse(fs.readFileSync(this.metadataFile, 'utf8'));
        
        return metadata.assets.filter(asset => {
            const searchText = JSON.stringify(asset).toLowerCase();
            const queryLower = query.toLowerCase();
            
            return searchText.includes(queryLower) ||
                   asset.tags.some(tag => tag.toLowerCase().includes(queryLower)) ||
                   asset.description.toLowerCase().includes(queryLower);
        });
    }
    
    getAssetsByType(assetType, limit = 50) {
        const metadata = JSON.parse(fs.readFileSync(this.metadataFile, 'utf8'));
        return metadata.assets
            .filter(asset => asset.assetType === assetType)
            .slice(0, limit);
    }
    
    getExtension(assetType, mimeType) {
        const extensions = {
            'video': '.mp4',
            'image': '.png',
            'audio': '.mp3',
            'document': '.txt',
            'project': '.zip'
        };
        
        if (mimeType) {
            const mimeMap = {
                'video/mp4': '.mp4',
                'video/webm': '.webm',
                'image/png': '.png',
                'image/jpeg': '.jpg',
                'image/gif': '.gif',
                'audio/mpeg': '.mp3',
                'audio/wav': '.wav',
                'application/pdf': '.pdf',
                'text/plain': '.txt',
                'application/json': '.json'
            };
            
            return mimeMap[mimeType] || extensions[assetType] || '.bin';
        }
        
        return extensions[assetType] || '.bin';
    }
    
    getMimeType(extension) {
        const mimeMap = {
            '.mp4': 'video/mp4',
            '.webm': 'video/webm',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.mp3': 'audio/mpeg',
            '.wav': 'audio/wav',
            '.pdf': 'application/pdf',
            '.txt': 'text/plain',
            '.json': 'application/json',
            '.zip': 'application/zip'
        };
        
        return mimeMap[extension.toLowerCase()] || 'application/octet-stream';
    }
    
    getStorageStats() {
        const metadata = JSON.parse(fs.readFileSync(this.metadataFile, 'utf8'));
        
        const stats = {
            totalAssets: metadata.assets.length,
            byType: {},
            totalSize: 0,
            oldest: null,
            newest: null,
            mostAccessed: null
        };
        
        metadata.assets.forEach(asset => {
            // Count by type
            stats.byType[asset.assetType] = (stats.byType[asset.assetType] || 0) + 1;
            
            // Sum sizes
            stats.totalSize += asset.size;
            
            // Find oldest/newest
            const assetDate = new Date(asset.createdAt);
            if (!stats.oldest || assetDate < new Date(stats.oldest.createdAt)) {
                stats.oldest = asset;
            }
            if (!stats.newest || assetDate > new Date(stats.newest.createdAt)) {
                stats.newest = asset;
            }
            
            // Find most accessed
            if (!stats.mostAccessed || asset.accessCount > stats.mostAccessed.accessCount) {
                stats.mostAccessed = asset;
            }
        });
        
        // Format size
        stats.totalSizeFormatted = this.formatBytes(stats.totalSize);
        
        return stats;
    }
    
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    createProject(projectName, files = []) {
        const projectId = crypto.randomBytes(8).toString('hex');
        const timestamp = Date.now();
        const projectDir = path.join(this.baseDir, 'projects', `${projectName}_${projectId}`);
        
        // Create project directory
        fs.mkdirSync(projectDir, { recursive: true });
        
        // Create project structure
        const structure = {
            'src/': [],
            'public/': [],
            'styles/': [],
            'scripts/': [],
            'assets/': [],
            'config/': []
        };
        
        Object.keys(structure).forEach(dir => {
            fs.mkdirSync(path.join(projectDir, dir), { recursive: true });
        });
        
        // Add default files
        const defaultFiles = {
            'package.json': JSON.stringify({
                name: projectName,
                version: '1.0.0',
                description: `Project generated by RAHL AI - ${projectName}`,
                main: 'src/index.js',
                scripts: {
                    start: 'node src/index.js',
                    dev: 'nodemon src/index.js',
                    build: 'npm run build'
                }
            }, null, 2),
            
            'README.md': `# ${projectName}\n\nGenerated by RAHL AI on ${new Date().toISOString()}\n\n## Project Structure\n\n${Object.keys(structure).map(dir => `- ${dir}`).join('\n')}`,
            
            '.gitignore': `node_modules/\n.env\n*.log\n.DS_Store\nbuild/\ndist/`,
            
            'src/index.js': `// ${projectName} - Main entry point\nconsole.log('${projectName} started!');\n\n// Your code here...`,
            
            'public/index.html': `<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>${projectName}</title>\n    <link rel="stylesheet" href="/styles/main.css">\n</head>\n<body>\n    <h1>${projectName}</h1>\n    <div id="app">Loading...</div>\n    <script src="/scripts/main.js"></script>\n</body>\n</html>`,
            
            'styles/main.css': `/* ${projectName} - Main Styles */\nbody {\n    font-family: Arial, sans-serif;\n    margin: 0;\n    padding: 20px;\n    background: #f5f5f5;\n}\n\nh1 {\n    color: #333;\n}`
        };
        
        Object.entries(defaultFiles).forEach(([filename, content]) => {
            const filePath = path.join(projectDir, filename);
            const dir = path.dirname(filePath);
            
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            fs.writeFileSync(filePath, content);
        });
        
        // Add user files
        files.forEach(file => {
            const filePath = path.join(projectDir, file.path || file.name);
            const dir = path.dirname(filePath);
            
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            fs.writeFileSync(filePath, file.content);
        });
        
        // Create project metadata
        const projectMetadata = {
            projectId,
            projectName,
            projectDir: `projects/${projectName}_${projectId}`,
            createdAt: new Date().toISOString(),
            files: [...Object.keys(defaultFiles), ...files.map(f => f.name || f.path)],
            totalFiles: Object.keys(defaultFiles).length + files.length,
            size: this.calculateDirectorySize(projectDir)
        };
        
        // Save project metadata
        this.storeAsset(
            Buffer.from(JSON.stringify(projectMetadata, null, 2)),
            'metadata',
            {
                tags: ['project', projectName],
                description: `Project: ${projectName}`
            }
        );
        
        // Zip project for download
        const zipPath = this.zipDirectory(projectDir, projectName);
        
        return {
            success: true,
            projectId,
            projectName,
            projectPath: `/assets/projects/${projectName}_${projectId}`,
            downloadUrl: `/api/projects/download/${projectId}`,
            zipUrl: `/assets/exports/${path.basename(zipPath)}`,
            metadata: projectMetadata,
            livePreviewUrl: `/projects/${projectId}/preview`
        };
    }
    
    calculateDirectorySize(dir) {
        let totalSize = 0;
        
        const calculate = (currentDir) => {
            const items = fs.readdirSync(currentDir, { withFileTypes: true });
            
            items.forEach(item => {
                const fullPath = path.join(currentDir, item.name);
                
                if (item.isDirectory()) {
                    calculate(fullPath);
                } else {
                    const stats = fs.statSync(fullPath);
                    totalSize += stats.size;
                }
            });
        };
        
        calculate(dir);
        return totalSize;
    }
    
    zipDirectory(sourceDir, zipName) {
        const archiver = require('archiver');
        const outputPath = path.join(this.baseDir, 'exports', `${zipName}_${Date.now()}.zip`);
        const output = fs.createWriteStream(outputPath);
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        return new Promise((resolve, reject) => {
            output.on('close', () => resolve(outputPath));
            archive.on('error', reject);
            
            archive.pipe(output);
            archive.directory(sourceDir, false);
            archive.finalize();
        });
    }
    
    getProject(projectId) {
        const projects = this.searchAssets('project');
        const project = projects.find(p => p.assetId === projectId || p.filename.includes(projectId));
        
        if (!project) {
            return null;
        }
        
        const projectData = this.getAsset(project.assetId);
        if (!projectData) {
            return null;
        }
        
        const metadata = JSON.parse(projectData.buffer.toString());
        const projectDir = path.join(this.baseDir, metadata.projectDir);
        
        // Read project structure
        const structure = this.readDirectoryStructure(projectDir);
        
        return {
            ...metadata,
            structure,
            files: this.getAllFiles(projectDir),
            lastModified: fs.statSync(projectDir).mtime
        };
    }
    
    readDirectoryStructure(dir) {
        const structure = {};
        
        const readDir = (currentDir, basePath = '') => {
            const items = fs.readdirSync(currentDir, { withFileTypes: true });
            
            items.forEach(item => {
                const relativePath = path.join(basePath, item.name);
                
                if (item.isDirectory()) {
                    structure[relativePath + '/'] = 'directory';
                    readDir(path.join(currentDir, item.name), relativePath);
                } else {
                    structure[relativePath] = 'file';
                }
            });
        };
        
        readDir(dir);
        return structure;
    }
    
    getAllFiles(dir) {
        const files = [];
        
        const traverse = (currentDir, basePath = '') => {
            const items = fs.readdirSync(currentDir, { withFileTypes: true });
            
            items.forEach(item => {
                const relativePath = path.join(basePath, item.name);
                const fullPath = path.join(currentDir, item.name);
                
                if (item.isDirectory()) {
                    traverse(fullPath, relativePath);
                } else {
                    const stats = fs.statSync(fullPath);
                    const content = fs.readFileSync(fullPath, 'utf8');
                    
                    files.push({
                        name: item.name,
                        path: relativePath,
                        size: stats.size,
                        type: this.getFileType(item.name),
                        content: content,
                        lastModified: stats.mtime
                    });
                }
            });
        };
        
        traverse(dir);
        return files;
    }
    
    getFileType(filename) {
        const ext = path.extname(filename).toLowerCase();
        const typeMap = {
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.html': 'html',
            '.css': 'css',
            '.json': 'json',
            '.md': 'markdown',
            '.py': 'python',
            '.java': 'java',
            '.cpp': 'cpp',
            '.c': 'c',
            '.go': 'go',
            '.rs': 'rust',
            '.php': 'php',
            '.rb': 'ruby',
            '.sh': 'shell'
        };
        
        return typeMap[ext] || 'text';
    }
}

module.exports = AssetManager;

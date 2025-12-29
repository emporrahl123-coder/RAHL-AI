// RAHL AI - Node.js Version
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// RAHL AI Core
class RAHL {
    constructor() {
        this.name = "RAHL";
        this.learned = [];
        console.log("🤖 RAHL AI initialized");
    }
    
    process(input) {
        console.log(`Processing: "${input}"`);
        
        // Simple responses
        const responses = [
            `I'm learning from: "${input}"`,
            `Interesting! "${input}" makes me think...`,
            `Processing your query about "${input}"`,
            `RAHL is analyzing: "${input}"`
        ];
        
        // Learn from input
        this.learned.push({
            input: input,
            timestamp: new Date().toISOString()
        });
        
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    getStatus() {
        return {
            name: this.name,
            learnedCount: this.learned.length,
            status: "Online"
        };
    }
}

// Initialize RAHL
const rahl = new RAHL();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/status', (req, res) => {
    res.json(rahl.getStatus());
});

app.post('/api/chat', (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ error: "No message provided" });
    }
    
    const response = rahl.process(message);
    res.json({ response });
});

app.get('/api/learned', (req, res) => {
    res.json({ learned: rahl.learned.slice(-10) });
});

// Start server
app.listen(PORT, () => {
    console.log(`
    ╔══════════════════════════════════╗
    ║       RAHL AI Server Online      ║
    ║   http://localhost:${PORT}           ║
    ╚══════════════════════════════════╝
    `);
});

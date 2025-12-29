// app.js - Express server that handles button clicks
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Store AI state
let aiState = {
    messages: 0,
    learning: 0,
    memory: [],
    isActive: true
};

// Middleware
app.use(express.json());
app.use(express.static('public'));

// API Endpoints for buttons
app.post('/api/start-learning', (req, res) => {
    aiState.isActive = true;
    aiState.learning += 10;
    res.json({ 
        status: 'Learning started',
        progress: aiState.learning 
    });
});

app.post('/api/analyze', (req, res) => {
    const { data } = req.body;
    
    // Simulate analysis
    const analysis = {
        patterns: Math.floor(Math.random() * 10),
        insights: ['Pattern detected', 'Connection found', 'Anomaly identified'],
        confidence: Math.random() * 100
    };
    
    res.json(analysis);
});

app.post('/api/create', (req, res) => {
    const { prompt } = req.body;
    
    const creations = [
        `Created content based on: ${prompt}`,
        `Generated new idea from: ${prompt}`,
        `Built solution for: ${prompt}`
    ];
    
    res.json({ 
        creation: creations[Math.floor(Math.random() * creations.length)],
        timestamp: new Date().toISOString()
    });
});

app.get('/api/status', (req, res) => {
    res.json(aiState);
});

app.post('/api/reset', (req, res) => {
    aiState = {
        messages: 0,
        learning: 0,
        memory: [],
        isActive: true
    };
    res.json({ status: 'AI reset successfully' });
});

app.post('/api/chat', (req, res) => {
    const { message } = req.body;
    aiState.messages++;
    
    const responses = [
        `I processed: "${message}"`,
        `Learning from: "${message}"`,
        `Analyzing: "${message}"`,
        `Creating response for: "${message}"`
    ];
    
    res.json({ 
        response: responses[Math.floor(Math.random() * responses.length)],
        messageCount: aiState.messages
    });
});

// Serve HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`
    🤖 RAHL AI Server Running
    🌐 http://localhost:${PORT}
    
    Available Endpoints:
    • POST /api/start-learning
    • POST /api/analyze  
    • POST /api/create
    • GET  /api/status
    • POST /api/reset
    • POST /api/chat
    `);
});

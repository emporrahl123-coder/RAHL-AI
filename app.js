const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// File upload configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Import Capabilities
const CapabilityRegistry = require('./capabilities/registry');
const capabilityRegistry = new CapabilityRegistry();

// RAHL AI Core
class RAHLCore {
  constructor() {
    this.memory = [];
    this.learningRate = 0.1;
    this.conversationHistory = [];
    console.log('🤖 RAHL AI Core Initialized');
  }

  async processMessage(message, userId = 'default') {
    // Add to conversation history
    this.conversationHistory.push({
      userId,
      message,
      timestamp: new Date().toISOString()
    });

    // Keep only last 50 messages
    if (this.conversationHistory.length > 50) {
      this.conversationHistory = this.conversationHistory.slice(-50);
    }

    // Auto-detect capability
    const detectedCapability = await capabilityRegistry.detectCapability(message);
    
    if (detectedCapability) {
      try {
        const result = await capabilityRegistry.executeCapability(detectedCapability, message);
        this.learningRate = Math.min(1.0, this.learningRate + 0.01);
        
        return {
          type: 'capability',
          capability: detectedCapability,
          result: result,
          message: `I used ${detectedCapability.replace('_', ' ')} to process your request.`
        };
      } catch (error) {
        console.error('Capability execution error:', error);
      }
    }

    // Default AI response
    return {
      type: 'response',
      message: this.generateResponse(message),
      learningRate: this.learningRate
    };
  }

  generateResponse(input) {
    const responses = {
      greeting: [
        "Hello! I'm RAHL AI. I can help you with web search, calculations, code execution, and more!",
        "Hi there! I'm ready to assist you with various capabilities.",
        "Greetings! How can I help you today? I can search the web, run code, analyze data, and much more."
      ],
      help: [
        "I have these capabilities: 🔍 Web Search, 💻 Code Execution, 🧮 Calculator, 📧 Email, 📊 Data Analysis, 📄 Document Processing, 🤖 Automation.",
        "You can ask me to: search for information, calculate math problems, run code, send emails, analyze data, process documents, or automate tasks.",
        "Try saying: 'search for AI news', 'calculate 2+2*3', 'run code: console.log(Hello)', or 'help me analyze this data'."
      ],
      default: [
        "I understand. How can I assist you with my capabilities?",
        "Got it! Let me know what you'd like me to do.",
        "I'm here to help. What would you like to accomplish?"
      ]
    };

    const inputLower = input.toLowerCase();
    
    if (inputLower.includes('hello') || inputLower.includes('hi')) {
      return responses.greeting[Math.floor(Math.random() * responses.greeting.length)];
    } else if (inputLower.includes('help') || inputLower.includes('what can you do')) {
      return responses.help[Math.floor(Math.random() * responses.help.length)];
    } else {
      return responses.default[Math.floor(Math.random() * responses.default.length)];
    }
  }

  getStatus() {
    return {
      status: 'online',
      capabilities: capabilityRegistry.listCapabilities(),
      memoryUsage: this.memory.length,
      learningRate: this.learningRate,
      conversationHistory: this.conversationHistory.length
    };
  }
}

// Initialize RAHL Core
const rahl = new RAHLCore();

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/status', (req, res) => {
  res.json(rahl.getStatus());
});

app.get('/api/capabilities', (req, res) => {
  res.json({
    capabilities: capabilityRegistry.listCapabilities(),
    count: capabilityRegistry.listCapabilities().length
  });
});

app.post('/api/chat', async (req, res) => {
  const { message, userId } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const response = await rahl.processMessage(message, userId || 'anonymous');
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/capabilities/execute', async (req, res) => {
  const { capability, input, parameters } = req.body;
  
  if (!capability || !input) {
    return res.status(400).json({ 
      error: 'Capability and input are required',
      available: capabilityRegistry.listCapabilities().map(c => c.name)
    });
  }

  try {
    const result = await capabilityRegistry.executeCapability(capability, input, parameters);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/capabilities/auto-detect', async (req, res) => {
  const { input } = req.body;
  
  if (!input) {
    return res.status(400).json({ error: 'Input is required' });
  }

  try {
    const capability = await capabilityRegistry.detectCapability(input);
    
    if (!capability) {
      return res.json({
        detected: false,
        suggestions: capabilityRegistry.listCapabilities()
      });
    }

    const result = await capabilityRegistry.executeCapability(capability, input);
    
    res.json({
      detected: true,
      capability: capability,
      result: result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  res.json({
    success: true,
    file: {
      filename: req.file.filename,
      originalname: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype
    }
  });
});

// Document processing endpoint
app.post('/api/process-document', async (req, res) => {
  const { filepath } = req.body;
  
  if (!filepath || !fs.existsSync(filepath)) {
    return res.status(400).json({ error: 'Valid file path required' });
  }

  try {
    const DocumentProcessor = require('./capabilities/document-processor');
    const processor = new DocumentProcessor();
    const result = await processor.processFile(filepath);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Webhook for external services
app.post('/api/webhook', (req, res) => {
  console.log('Webhook received:', req.body);
  // Process webhook data here
  res.json({ received: true, timestamp: new Date().toISOString() });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    capabilities: capabilityRegistry.listCapabilities().length
  });
});

// Serve capabilities documentation
app.get('/api/capabilities/:name', (req, res) => {
  const capability = capabilityRegistry.getCapability(req.params.name);
  
  if (!capability) {
    return res.status(404).json({ error: 'Capability not found' });
  }

  res.json({
    name: capability.name,
    description: capability.description || 'No description available',
    examples: capability.examples || [],
    parameters: capability.parameters || {}
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
  🚀 RAHL AI Server Started
  =========================
  🌐 URL: http://localhost:${PORT}
  ⏰ Time: ${new Date().toLocaleTimeString()}
  🤖 Capabilities: ${capabilityRegistry.listCapabilities().length} loaded
  
  Available Endpoints:
  • GET  /                    - Web interface
  • GET  /api/status          - System status
  • GET  /api/capabilities    - List all capabilities
  • POST /api/chat            - Chat with RAHL
  • POST /api/capabilities/execute    - Execute specific capability
  • POST /api/capabilities/auto-detect - Auto-detect and execute
  
  Capabilities loaded:
  ${capabilityRegistry.listCapabilities().map(c => `  • ${c.name}: ${c.description}`).join('\n')}
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

module.exports = app;

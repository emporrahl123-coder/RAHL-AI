// capabilities/registry.js
const fs = require('fs');
const path = require('path');

class CapabilityRegistry {
    constructor() {
        this.capabilities = new Map();
        this.loadAllCapabilities();
    }
    
    loadAllCapabilities() {
        const capabilitiesDir = path.join(__dirname);
        
        // List all capability files
        const capabilityFiles = fs.readdirSync(capabilitiesDir)
            .filter(file => file.endsWith('.js') && file !== 'registry.js');
        
        capabilityFiles.forEach(file => {
            try {
                const CapabilityClass = require(path.join(capabilitiesDir, file));
                const instance = new CapabilityClass();
                this.capabilities.set(instance.name, instance);
                console.log(`✅ Loaded capability: ${instance.name}`);
            } catch (error) {
                console.error(`❌ Failed to load ${file}:`, error.message);
            }
        });
    }
    
    getCapability(name) {
        return this.capabilities.get(name);
    }
    
    listCapabilities() {
        return Array.from(this.capabilities.values()).map(cap => ({
            name: cap.name,
            description: cap.description || 'No description'
        }));
    }
    
    async detectCapability(userInput) {
        const input = userInput.toLowerCase();
        
        // Detection logic
        if (input.includes('search') || input.includes('find')) {
            return 'web_search';
        } else if (input.includes('calculate') || input.includes('math')) {
            return 'calculator';
        } else if (input.includes('code') || input.includes('program')) {
            return 'code_executor';
        } else if (input.includes('email') || input.includes('send')) {
            return 'email_client';
        } else if (input.includes('analyze') || input.includes('data')) {
            return 'data_analyzer';
        }
        
        return null;
    }
    
    async executeCapability(capabilityName, ...args) {
        const capability = this.getCapability(capabilityName);
        if (!capability) {
            throw new Error(`Capability '${capabilityName}' not found`);
        }
        
        return await capability.execute(...args);
    }
}

module.exports = CapabilityRegistry;

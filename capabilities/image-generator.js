const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

class ImageGenerator {
    constructor() {
        this.name = "image_generator";
        this.description = "Generate images using AI and image manipulation";
        this.version = "1.0.0";
        this.tempDir = path.join(__dirname, '../temp/images');
        
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }
    
    async execute(prompt, options = {}) {
        try {
            const type = options.type || 'ai';
            const timestamp = Date.now();
            
            let result;
            
            switch(type) {
                case 'ai':
                    result = await this.generateAIImage(prompt, options);
                    break;
                case 'chart':
                    result = await this.generateChart(prompt, options);
                    break;
                case 'meme':
                    result = await this.generateMeme(prompt, options);
                    break;
                case 'composite':
                    result = await this.createComposite(prompt, options);
                    break;
                default:
                    result = await this.generateBasicImage(prompt, options);
            }
            
            return {
                success: true,
                prompt: prompt,
                imageUrl: `/images/${path.basename(result.imagePath)}`,
                imagePath: result.imagePath,
                type: type,
                dimensions: result.dimensions,
                fileSize: this.formatFileSize(fs.statSync(result.imagePath).size),
                source: this.name,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                prompt: prompt,
                source: this.name
            };
        }
    }
    
    async generateAIImage(prompt, options) {
        // Using Stable Diffusion API or DALL-E
        const apiKey = process.env.STABLE_DIFFUSION_API_KEY || process.env.OPENAI_API_KEY;
        
        if (apiKey && process.env.OPENAI_API_KEY) {
            // Use DALL-E
            const response = await axios.post('https://api.openai.com/v1/images/generations', {
                prompt: prompt,
                n: 1,
                size: options.size || '1024x1024',
                response_format: 'url'
            }, {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const imageUrl = response.data.data[0].url;
            const imagePath = path.join(this.tempDir, `dalle_${Date.now()}.png`);
            
            await this.downloadImage(imageUrl, imagePath);
            
            return {
                imagePath,
                dimensions: options.size || '1024x1024',
                model: 'DALL-E'
            };
        } else {
            // Fallback to canvas-based generation
            return await this.generateBasicImage(prompt, options);
        }
    }
    
    async generateBasicImage(prompt, options) {
        const width = options.width || 1024;
        const height = options.height || 1024;
        const imagePath = path.join(this.tempDir, `canvas_${Date.now()}.png`);
        
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        
        // Generate gradient background based on prompt
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        
        // Use prompt to determine colors
        const colors = this.extractColorsFromPrompt(prompt);
        gradient.addColorStop(0, colors[0]);
        gradient.addColorStop(1, colors[1]);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Add text
        ctx.fillStyle = '#ffffff';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Wrap text
        const words = prompt.split(' ');
        const lines = [];
        let currentLine = words[0];
        
        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + ' ' + word).width;
            if (width < canvas.width * 0.8) {
                currentLine += ' ' + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        
        // Draw lines
        const lineHeight = 60;
        const startY = (height - (lines.length * lineHeight)) / 2;
        
        lines.forEach((line, index) => {
            ctx.fillText(line, width / 2, startY + (index * lineHeight));
        });
        
        // Save image
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(imagePath, buffer);
        
        return {
            imagePath,
            dimensions: `${width}x${height}`,
            model: 'Canvas'
        };
    }
    
    async generateChart(data, options) {
        const width = options.width || 800;
        const height = options.height || 600;
        const imagePath = path.join(this.tempDir, `chart_${Date.now()}.png`);
        
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        
        // Parse data
        const values = this.parseChartData(data);
        const maxValue = Math.max(...values);
        const barWidth = width / values.length * 0.8;
        
        // Background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, width, height);
        
        // Draw bars
        values.forEach((value, index) => {
            const barHeight = (value / maxValue) * (height * 0.7);
            const x = (index * (width / values.length)) + (width * 0.1);
            const y = height - barHeight - 50;
            
            // Gradient for bars
            const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
            gradient.addColorStop(0, '#00ff88');
            gradient.addColorStop(1, '#007744');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, barWidth, barHeight);
            
            // Value label
            ctx.fillStyle = '#ffffff';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(value.toString(), x + barWidth/2, y - 10);
        });
        
        // Save image
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(imagePath, buffer);
        
        return {
            imagePath,
            dimensions: `${width}x${height}`,
            type: 'bar_chart',
            dataPoints: values.length
        };
    }
    
    async generateMeme(text, options) {
        const template = options.template || 'drake';
        const imagePath = path.join(this.tempDir, `meme_${Date.now()}.png`);
        
        const canvas = createCanvas(800, 800);
        const ctx = canvas.getContext('2d');
        
        // Background color
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 800, 800);
        
        // Meme template based on text
        const lines = text.split('|');
        const topText = lines[0] || '';
        const bottomText = lines[1] || '';
        
        // Draw top text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px Impact';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        
        ctx.strokeText(topText.toUpperCase(), 400, 100);
        ctx.fillText(topText.toUpperCase(), 400, 100);
        
        // Draw bottom text
        ctx.strokeText(bottomText.toUpperCase(), 400, 700);
        ctx.fillText(bottomText.toUpperCase(), 400, 700);
        
        // Save image
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(imagePath, buffer);
        
        return {
            imagePath,
            dimensions: '800x800',
            type: 'meme',
            template: template
        };
    }
    
    async downloadImage(url, outputPath) {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });
        
        const writer = fs.createWriteStream(outputPath);
        response.data.pipe(writer);
        
        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    }
    
    extractColorsFromPrompt(prompt) {
        const colorMap = {
            'blue': ['#1e3a8a', '#3b82f6'],
            'red': ['#7f1d1d', '#ef4444'],
            'green': ['#14532d', '#22c55e'],
            'purple': ['#4c1d95', '#8b5cf6'],
            'orange': ['#7c2d12', '#f97316'],
            'pink': ['#831843', '#ec4899'],
            'yellow': ['#713f12', '#eab308']
        };
        
        for (const [color, gradient] of Object.entries(colorMap)) {
            if (prompt.toLowerCase().includes(color)) {
                return gradient;
            }
        }
        
        // Default gradient
        return ['#1e3a8a', '#3b82f6'];
    }
    
    parseChartData(data) {
        if (Array.isArray(data)) {
            return data.map(v => parseFloat(v) || 0);
        }
        
        if (typeof data === 'string') {
            return data.split(/[\s,]+/).map(v => parseFloat(v) || 0);
        }
        
        return [10, 20, 30, 40, 50]; // Default data
    }
    
    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Byte';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    }
}

module.exports = ImageGenerator;

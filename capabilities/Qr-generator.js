const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

class QRGenerator {
    constructor() {
        this.name = "qr_generator";
        this.description = "Generate QR codes with custom designs";
        this.version = "1.0.0";
        this.tempDir = path.join(__dirname, '../temp/qr_codes');
        
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }
    
    async execute(data, options = {}) {
        try {
            const type = this.detectDataType(data);
            const timestamp = Date.now();
            const outputPath = path.join(this.tempDir, `qr_${timestamp}.png`);
            
            const qrOptions = {
                errorCorrectionLevel: options.errorCorrection || 'H',
                margin: options.margin || 1,
                width: options.size || 400,
                color: {
                    dark: options.darkColor || '#000000',
                    light: options.lightColor || '#ffffff'
                }
            };
            
            // Generate QR code
            await QRCode.toFile(outputPath, data, qrOptions);
            
            // Add logo if specified
            if (options.logo) {
                await this.addLogo(outputPath, options.logo);
            }
            
            // Add custom styling
            if (options.style === 'rounded' || options.style === 'dots') {
                await this.applyStyle(outputPath, options.style);
            }
            
            return {
                success: true,
                data: data.substring(0, 100) + (data.length > 100 ? '...' : ''),
                dataType: type,
                qrCodeUrl: `/qr_codes/${path.basename(outputPath)}`,
                qrCodePath: outputPath,
                dimensions: `${qrOptions.width}x${qrOptions.width}`,
                errorCorrection: qrOptions.errorCorrectionLevel,
                colors: {
                    dark: qrOptions.color.dark,
                    light: qrOptions.color.light
                },
                source: this.name,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                data: data,
                source: this.name
            };
        }
    }
    
    detectDataType(data) {
        if (data.startsWith('http://') || data.startsWith('https://')) {
            return 'URL';
        } else if (data.includes('@') && data.includes('.')) {
            return 'Email';
        } else if (data.startsWith('tel:')) {
            return 'Phone';
        } else if (data.startsWith('BEGIN:VCARD')) {
            return 'Contact';
        } else if (data.startsWith('WIFI:')) {
            return 'WiFi';
        } else if (/^\d+$/.test(data)) {
            return 'Numeric';
        } else if (data.length <= 50) {
            return 'Text';
        } else {
            return 'Data';
        }
    }
    
    async addLogo(qrPath, logoOptions) {
        const canvas = createCanvas(400, 400);
        const ctx = canvas.getContext('2d');
        
        // Load QR code
        const qrImage = await this.loadImage(qrPath);
        ctx.drawImage(qrImage, 0, 0, 400, 400);
        
        // Load logo if URL provided
        if (logoOptions.url) {
            const logoImage = await this.loadImageFromURL(logoOptions.url);
            const logoSize = logoOptions.size || 80;
            const x = (400 - logoSize) / 2;
            const y = (400 - logoSize) / 2;
            
            // Draw white background for logo
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x - 5, y - 5, logoSize + 10, logoSize + 10);
            
            ctx.drawImage(logoImage, x, y, logoSize, logoSize);
        }
        
        // Save modified QR code
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(qrPath, buffer);
    }
    
    async applyStyle(qrPath, style) {
        const canvas = createCanvas(400, 400);
        const ctx = canvas.getContext('2d');
        
        const qrImage = await this.loadImage(qrPath);
        ctx.drawImage(qrImage, 0, 0, 400, 400);
        
        const imageData = ctx.getImageData(0, 0, 400, 400);
        
        if (style === 'rounded') {
            this.applyRoundedCorners(imageData);
        } else if (style === 'dots') {
            this.applyDotStyle(imageData);
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(qrPath, buffer);
    }
    
    applyRoundedCorners(imageData) {
        const radius = 5;
        
        for (let y = 0; y < 400; y++) {
            for (let x = 0; x < 400; x++) {
                const index = (y * 400 + x) * 4;
                
                // Check if this is a dark pixel (QR code)
                if (imageData.data[index] < 128) {
                    // Check corners
                    if ((x < radius && y < radius) || 
                        (x < radius && y > 400 - radius) ||
                        (x > 400 - radius && y < radius) ||
                        (x > 400 - radius && y > 400 - radius)) {
                        // Round corners by making them transparent
                        imageData.data[index + 3] = 0;
                    }
                }
            }
        }
    }
    
    applyDotStyle(imageData) {
        const dotSize = 3;
        
        for (let y = 0; y < 400; y += dotSize * 2) {
            for (let x = 0; x < 400; x += dotSize * 2) {
                // Sample the pixel at this grid position
                const sampleIndex = (y * 400 + x) * 4;
                
                if (imageData.data[sampleIndex] < 128) {
                    // Draw a circle
                    for (let dy = -dotSize; dy <= dotSize; dy++) {
                        for (let dx = -dotSize; dx <= dotSize; dx++) {
                            if (dx * dx + dy * dy <= dotSize * dotSize) {
                                const px = x + dx;
                                const py = y + dy;
                                
                                if (px >= 0 && px < 400 && py >= 0 && py < 400) {
                                    const index = (py * 400 + px) * 4;
                                    imageData.data[index] = 0;     // R
                                    imageData.data[index + 1] = 0; // G
                                    imageData.data[index + 2] = 0; // B
                                }
                            }
                        }
                    }
                } else {
                    // Clear the area for light pixels
                    for (let dy = -dotSize; dy <= dotSize; dy++) {
                        for (let dx = -dotSize; dx <= dotSize; dx++) {
                            const px = x + dx;
                            const py = y + dy;
                            
                            if (px >= 0 && px < 400 && py >= 0 && py < 400) {
                                const index = (py * 400 + px) * 4;
                                imageData.data[index + 3] = 0; // Alpha
                            }
                        }
                    }
                }
            }
        }
    }
    
    loadImage(path) {
        return new Promise((resolve) => {
            const img = new (require('canvas').Image)();
            img.onload = () => resolve(img);
            img.src = fs.readFileSync(path);
        });
    }
    
    loadImageFromURL(url) {
        const axios = require('axios');
        
        return new Promise(async (resolve, reject) => {
            try {
                const response = await axios.get(url, { responseType: 'arraybuffer' });
                const img = new (require('canvas').Image)();
                img.onload = () => resolve(img);
                img.src = Buffer.from(response.data);
            } catch (error) {
                reject(error);
            }
        });
    }
    
    async generateContactQR(contactInfo) {
        const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${contactInfo.name || ''}
ORG:${contactInfo.company || ''}
TITLE:${contactInfo.title || ''}
TEL;TYPE=WORK,VOICE:${contactInfo.workPhone || ''}
TEL;TYPE=HOME,VOICE:${contactInfo.homePhone || ''}
TEL;TYPE=CELL,VOICE:${contactInfo.mobile || ''}
EMAIL;TYPE=PREF,INTERNET:${contactInfo.email || ''}
URL:${contactInfo.website || ''}
ADR;TYPE=WORK:;;${contactInfo.street || ''};${contactInfo.city || ''};${contactInfo.state || ''};${contactInfo.zip || ''};${contactInfo.country || ''}
NOTE:${contactInfo.notes || ''}
END:VCARD`;
        
        return await this.execute(vcard, { 
            type: 'contact',
            errorCorrection: 'H' 
        });
    }
    
    async generateWiFiQR(ssid, password, encryption = 'WPA') {
        const wifiString = `WIFI:S:${ssid};T:${encryption};P:${password};;`;
        return await this.execute(wifiString, {
            type: 'wifi',
            errorCorrection: 'M'
        });
    }
    
    async generatePaymentQR(paymentInfo) {
        let paymentString;
        
        if (paymentInfo.type === 'upi') {
            paymentString = `upi://pay?pa=${paymentInfo.upiId}&pn=${encodeURIComponent(paymentInfo.name)}&am=${paymentInfo.amount}&cu=INR`;
        } else if (paymentInfo.type === 'bitcoin') {
            paymentString = `bitcoin:${paymentInfo.address}?amount=${paymentInfo.amount}`;
        } else if (paymentInfo.type === 'ethereum') {
            paymentString = `ethereum:${paymentInfo.address}?value=${paymentInfo.amount}`;
        } else {
            throw new Error('Unsupported payment type');
        }
        
        return await this.execute(paymentString, {
            type: 'payment',
            errorCorrection: 'H'
        });
    }
    
    async generateBatchQR(dataArray, options = {}) {
        const results = [];
        
        for (let i = 0; i < dataArray.length; i++) {
            const result = await this.execute(dataArray[i], {
                ...options,
                filename: `batch_${i}_${Date.now()}`
            });
            results.push(result);
        }
        
        return {
            success: true,
            batchResults: results,
            totalGenerated: results.length,
            source: this.name
        };
    }
    
    async readQRCode(imagePath) {
        try {
            const jsQR = require('jsqr');
            const PNG = require('pngjs').PNG;
            
            const buffer = fs.readFileSync(imagePath);
            const png = PNG.sync.read(buffer);
            
            const code = jsQR(
                new Uint8ClampedArray(png.data),
                png.width,
                png.height
            );
            
            if (code) {
                return {
                    success: true,
                    data: code.data,
                    format: this.detectDataType(code.data),
                    bounds: code.location,
                    version: code.version,
                    source: this.name
                };
            } else {
                return {
                    success: false,
                    error: 'No QR code found in image',
                    source: this.name
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                source: this.name
            };
        }
    }
}

module.exports = QRGenerator;

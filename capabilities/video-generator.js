const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { createCanvas, loadImage } = require('canvas');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class VideoGenerator {
    constructor() {
        this.name = "video_generator";
        this.description = "Generate videos from text, images, or data";
        this.version = "1.0.0";
        this.supportedFormats = ['mp4', 'webm', 'gif', 'mov'];
        this.tempDir = path.join(__dirname, '../temp/videos');
        
        // Create temp directory
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    async execute(command, options = {}) {
        try {
            console.log(`🎬 Executing video generation: ${command}`);
            
            const action = this.parseCommand(command);
            
            switch(action.type) {
                case 'text_to_video':
                    return await this.textToVideo(action.text, options);
                case 'slideshow':
                    return await this.createSlideshow(action.images, options);
                case 'data_visualization':
                    return await this.dataToVideo(action.data, options);
                case 'edit_video':
                    return await this.editVideo(action.videoPath, options);
                case 'extract_frames':
                    return await this.extractFrames(action.videoPath, options);
                default:
                    throw new Error(`Unknown video action: ${action.type}`);
            }
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                command: command,
                source: this.name
            };
        }
    }

    parseCommand(command) {
        const lowerCmd = command.toLowerCase();
        
        if (lowerCmd.includes('text to video') || lowerCmd.includes('create video from text')) {
            const text = command.replace(/text to video|create video from text/i, '').trim();
            return { type: 'text_to_video', text };
        }
        
        if (lowerCmd.includes('slideshow') || lowerCmd.includes('image video')) {
            const images = command.match(/(https?:\/\/[^\s]+)/g) || [];
            return { type: 'slideshow', images };
        }
        
        if (lowerCmd.includes('data visualization') || lowerCmd.includes('chart video')) {
            return { type: 'data_visualization', data: command };
        }
        
        if (lowerCmd.includes('edit video') || lowerCmd.includes('trim video')) {
            const videoMatch = command.match(/(https?:\/\/[^\s]+|\.(mp4|webm|mov|avi))/i);
            return { 
                type: 'edit_video', 
                videoPath: videoMatch ? videoMatch[0] : null 
            };
        }
        
        if (lowerCmd.includes('extract frames') || lowerCmd.includes('get frames')) {
            const videoMatch = command.match(/(https?:\/\/[^\s]+|\.(mp4|webm|mov|avi))/i);
            return { 
                type: 'extract_frames', 
                videoPath: videoMatch ? videoMatch[0] : null 
            };
        }
        
        // Default: text to video
        return { type: 'text_to_video', text: command };
    }

    async textToVideo(text, options = {}) {
        const timestamp = Date.now();
        const outputPath = path.join(this.tempDir, `text_video_${timestamp}.mp4`);
        
        // Create frames from text
        const framesDir = path.join(this.tempDir, `frames_${timestamp}`);
        fs.mkdirSync(framesDir, { recursive: true });
        
        // Split text into sentences for different frames
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        // Generate frames
        for (let i = 0; i < sentences.length; i++) {
            await this.createTextFrame(sentences[i], path.join(framesDir, `frame_${i.toString().padStart(4, '0')}.png`), {
                width: options.width || 1920,
                height: options.height || 1080,
                fontSize: options.fontSize || 48,
                backgroundColor: options.backgroundColor || '#000000',
                textColor: options.textColor || '#ffffff'
            });
        }
        
        // Create video from frames
        await this.createVideoFromFrames(framesDir, outputPath, {
            fps: options.fps || 1, // 1 second per frame
            duration: options.duration || sentences.length
        });
        
        // Clean up frames directory
        fs.rmSync(framesDir, { recursive: true, force: true });
        
        return {
            success: true,
            videoPath: outputPath,
            videoUrl: `/videos/${path.basename(outputPath)}`,
            duration: options.duration || sentences.length,
            frames: sentences.length,
            format: 'mp4',
            source: this.name,
            metadata: {
                textLength: text.length,
                sentences: sentences.length,
                dimensions: `${options.width || 1920}x${options.height || 1080}`,
                backgroundColor: options.backgroundColor || '#000000'
            }
        };
    }

    async createTextFrame(text, outputPath, options = {}) {
        const canvas = createCanvas(options.width, options.height);
        const ctx = canvas.getContext('2d');
        
        // Fill background
        ctx.fillStyle = options.backgroundColor;
        ctx.fillRect(0, 0, options.width, options.height);
        
        // Draw text
        ctx.fillStyle = options.textColor;
        ctx.font = `${options.fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Wrap text
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0];
        
        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + ' ' + word).width;
            if (width < options.width * 0.8) {
                currentLine += ' ' + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        
        // Draw lines
        const lineHeight = options.fontSize * 1.2;
        const startY = (options.height - (lines.length * lineHeight)) / 2;
        
        lines.forEach((line, index) => {
            ctx.fillText(line, options.width / 2, startY + (index * lineHeight));
        });
        
        // Save frame
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);
    }

    async createVideoFromFrames(framesDir, outputPath, options = {}) {
        return new Promise((resolve, reject) => {
            const pattern = path.join(framesDir, 'frame_%04d.png');
            
            ffmpeg()
                .input(pattern)
                .inputFPS(options.fps || 30)
                .outputOptions([
                    '-c:v libx264',
                    '-pix_fmt yuv420p',
                    '-preset medium',
                    '-crf 23'
                ])
                .duration(options.duration || 10)
                .on('start', (command) => {
                    console.log(`FFmpeg command: ${command}`);
                })
                .on('progress', (progress) => {
                    console.log(`Processing: ${progress.percent}%`);
                })
                .on('end', () => {
                    console.log('Video created successfully');
                    resolve(outputPath);
                })
                .on('error', (err) => {
                    console.error('Error creating video:', err);
                    reject(err);
                })
                .save(outputPath);
        });
    }

    async createSlideshow(imageUrls, options = {}) {
        const timestamp = Date.now();
        const outputPath = path.join(this.tempDir, `slideshow_${timestamp}.mp4`);
        
        // Download images
        const imagesDir = path.join(this.tempDir, `slideshow_images_${timestamp}`);
        fs.mkdirSync(imagesDir, { recursive: true });
        
        const imagePaths = [];
        for (let i = 0; i < Math.min(imageUrls.length, 10); i++) {
            try {
                const imagePath = path.join(imagesDir, `image_${i}.jpg`);
                await this.downloadImage(imageUrls[i], imagePath);
                imagePaths.push(imagePath);
            } catch (error) {
                console.error(`Failed to download image ${imageUrls[i]}:`, error.message);
            }
        }
        
        if (imagePaths.length === 0) {
            throw new Error('No images downloaded successfully');
        }
        
        // Create video from images
        await new Promise((resolve, reject) => {
            const command = ffmpeg();
            
            imagePaths.forEach((imagePath, index) => {
                command.input(imagePath);
                if (index > 0) {
                    command.input(imagePath);
                }
            });
            
            command
                .complexFilter([
                    `concat=n=${imagePaths.length}:v=1:a=0`,
                    `fade=t=in:st=0:d=1,fade=t=out:st=${imagePaths.length - 1}:d=1`
                ])
                .outputOptions([
                    '-c:v libx264',
                    '-pix_fmt yuv420p',
                    '-preset fast'
                ])
                .duration(imagePaths.length * (options.slideDuration || 3))
                .on('end', () => resolve())
                .on('error', reject)
                .save(outputPath);
        });
        
        // Clean up
        fs.rmSync(imagesDir, { recursive: true, force: true });
        
        return {
            success: true,
            videoPath: outputPath,
            videoUrl: `/videos/${path.basename(outputPath)}`,
            slides: imagePaths.length,
            duration: imagePaths.length * (options.slideDuration || 3),
            format: 'mp4',
            source: this.name
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

    async dataToVideo(data, options = {}) {
        const timestamp = Date.now();
        const outputPath = path.join(this.tempDir, `data_viz_${timestamp}.mp4`);
        
        // Parse data (assuming simple format for now)
        const lines = data.split('\n').filter(line => line.trim());
        
        // Create animated chart frames
        const framesDir = path.join(this.tempDir, `data_frames_${timestamp}`);
        fs.mkdirSync(framesDir, { recursive: true });
        
        // Generate frames with progressive data
        for (let i = 1; i <= Math.min(lines.length, 20); i++) {
            await this.createDataFrame(
                lines.slice(0, i),
                path.join(framesDir, `frame_${i.toString().padStart(4, '0')}.png`),
                options
            );
        }
        
        // Create video
        await this.createVideoFromFrames(framesDir, outputPath, {
            fps: options.fps || 2,
            duration: Math.min(lines.length, 20) / 2
        });
        
        // Clean up
        fs.rmSync(framesDir, { recursive: true, force: true });
        
        return {
            success: true,
            videoPath: outputPath,
            videoUrl: `/videos/${path.basename(outputPath)}`,
            dataPoints: Math.min(lines.length, 20),
            format: 'mp4',
            source: this.name,
            visualizationType: 'animated_chart'
        };
    }

    async createDataFrame(dataLines, outputPath, options = {}) {
        const canvas = createCanvas(1920, 1080);
        const ctx = canvas.getContext('2d');
        
        // Background
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, 1920, 1080);
        
        // Draw grid
        ctx.strokeStyle = '#2d3047';
        ctx.lineWidth = 1;
        
        // Vertical grid lines
        for (let x = 100; x <= 1820; x += 100) {
            ctx.beginPath();
            ctx.moveTo(x, 100);
            ctx.lineTo(x, 980);
            ctx.stroke();
        }
        
        // Horizontal grid lines
        for (let y = 100; y <= 980; y += 100) {
            ctx.beginPath();
            ctx.moveTo(100, y);
            ctx.lineTo(1820, y);
            ctx.stroke();
        }
        
        // Parse numeric data
        const values = dataLines.map(line => {
            const num = parseFloat(line.replace(/[^0-9.-]/g, ''));
            return isNaN(num) ? 0 : num;
        }).filter(v => v !== 0);
        
        if (values.length === 0) {
            // Draw placeholder text
            ctx.fillStyle = '#ffffff';
            ctx.font = '48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('No numeric data found', 960, 540);
        } else {
            // Draw line chart
            const maxVal = Math.max(...values);
            const minVal = Math.min(...values);
            const range = maxVal - minVal || 1;
            
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 4;
            ctx.beginPath();
            
            values.forEach((value, index) => {
                const x = 100 + (index * (1720 / (values.length - 1)));
                const y = 980 - ((value - minVal) / range) * 800;
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            
            ctx.stroke();
            
            // Draw data points
            ctx.fillStyle = '#ff3366';
            values.forEach((value, index) => {
                const x = 100 + (index * (1720 / (values.length - 1)));
                const y = 980 - ((value - minVal) / range) * 800;
                
                ctx.beginPath();
                ctx.arc(x, y, 8, 0, Math.PI * 2);
                ctx.fill();
            });
            
            // Add labels
            ctx.fillStyle = '#ffffff';
            ctx.font = '24px Arial';
            ctx.fillText(`Data Points: ${values.length}`, 960, 50);
            ctx.fillText(`Max: ${maxVal.toFixed(2)}`, 1600, 50);
            ctx.fillText(`Min: ${minVal.toFixed(2)}`, 1600, 80);
        }
        
        // Save frame
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);
    }

    async editVideo(videoPath, options = {}) {
        const timestamp = Date.now();
        const outputPath = path.join(this.tempDir, `edited_${timestamp}.mp4`);
        
        // Check if video exists
        if (!fs.existsSync(videoPath)) {
            // Try to download if it's a URL
            if (videoPath.startsWith('http')) {
                const downloadedPath = path.join(this.tempDir, `download_${timestamp}.mp4`);
                await this.downloadVideo(videoPath, downloadedPath);
                videoPath = downloadedPath;
            } else {
                throw new Error(`Video file not found: ${videoPath}`);
            }
        }
        
        // Get video info
        const info = await this.getVideoInfo(videoPath);
        
        // Apply edits based on options
        const edits = [];
        
        if (options.trimStart || options.trimEnd) {
            const start = options.trimStart || 0;
            const end = options.trimEnd || info.duration;
            edits.push(`trim=${start}:${end}`);
        }
        
        if (options.addText) {
            edits.push(`drawtext=text='${options.addText}':x=(w-text_w)/2:y=h/2:fontsize=48:fontcolor=white`);
        }
        
        if (options.addWatermark) {
            // Add watermark logic here
        }
        
        // Build ffmpeg command
        await new Promise((resolve, reject) => {
            const command = ffmpeg(videoPath);
            
            if (edits.length > 0) {
                command.videoFilters(edits.join(','));
            }
            
            command
                .outputOptions([
                    '-c:v libx264',
                    '-c:a aac',
                    '-preset fast'
                ])
                .on('end', () => resolve())
                .on('error', reject)
                .save(outputPath);
        });
        
        return {
            success: true,
            originalVideo: path.basename(videoPath),
            editedVideo: path.basename(outputPath),
            videoUrl: `/videos/${path.basename(outputPath)}`,
            editsApplied: edits,
            format: 'mp4',
            source: this.name,
            metadata: {
                originalDuration: info.duration,
                originalDimensions: info.dimensions
            }
        };
    }

    async getVideoInfo(videoPath) {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(videoPath, (err, metadata) => {
                if (err) reject(err);
                
                const videoStream = metadata.streams.find(s => s.codec_type === 'video');
                resolve({
                    duration: metadata.format.duration,
                    dimensions: videoStream ? `${videoStream.width}x${videoStream.height}` : 'Unknown',
                    codec: videoStream ? videoStream.codec_name : 'Unknown',
                    bitrate: metadata.format.bit_rate
                });
            });
        });
    }

    async downloadVideo(url, outputPath) {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const writer = fs.createWriteStream(outputPath);
        response.data.pipe(writer);
        
        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    }

    async extractFrames(videoPath, options = {}) {
        const timestamp = Date.now();
        const framesDir = path.join(this.tempDir, `frames_${timestamp}`);
        fs.mkdirSync(framesDir, { recursive: true });
        
        // Check if video exists
        if (!fs.existsSync(videoPath)) {
            throw new Error(`Video file not found: ${videoPath}`);
        }
        
        const frameRate = options.frameRate || 1; // 1 frame per second
        const framePattern = path.join(framesDir, 'frame_%04d.png');
        
        await new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .outputOptions(`-vf fps=${frameRate}`)
                .output(framePattern)
                .on('end', resolve)
                .on('error', reject)
                .run();
        });
        
        // Get list of extracted frames
        const frames = fs.readdirSync(framesDir)
            .filter(file => file.endsWith('.png'))
            .map(file => path.join(framesDir, file));
        
        return {
            success: true,
            framesDir: framesDir,
            frames: frames,
            frameCount: frames.length,
            frameRate: frameRate,
            source: this.name,
            videoInfo: await this.getVideoInfo(videoPath)
        };
    }

    async generateGIF(input, options = {}) {
        const timestamp = Date.now();
        const outputPath = path.join(this.tempDir, `animation_${timestamp}.gif`);
        
        // Generate frames if text input
        if (typeof input === 'string' && !input.includes('.')) {
            const framesDir = path.join(this.tempDir, `gif_frames_${timestamp}`);
            fs.mkdirSync(framesDir, { recursive: true });
            
            // Create simple animation frames
            for (let i = 0; i < 10; i++) {
                const canvas = createCanvas(400, 200);
                const ctx = canvas.getContext('2d');
                
                // Animated background
                const hue = (i * 36) % 360;
                ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
                ctx.fillRect(0, 0, 400, 200);
                
                // Text
                ctx.fillStyle = '#ffffff';
                ctx.font = '32px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(input, 200, 100);
                
                // Save frame
                const framePath = path.join(framesDir, `frame_${i.toString().padStart(4, '0')}.png`);
                const buffer = canvas.toBuffer('image/png');
                fs.writeFileSync(framePath, buffer);
            }
            
            input = framesDir;
        }
        
        // Create GIF
        await new Promise((resolve, reject) => {
            ffmpeg(input)
                .inputOptions('-pattern_type glob')
                .outputOptions([
                    '-vf fps=10',
                    '-s 400x200'
                ])
                .on('end', resolve)
                .on('error', reject)
                .save(outputPath);
        });
        
        return {
            success: true,
            gifPath: outputPath,
            gifUrl: `/videos/${path.basename(outputPath)}`,
            format: 'gif',
            dimensions: '400x200',
            source: this.name
        };
    }

    getUsageExamples() {
        return [
            "Create a video from text 'Welcome to RAHL AI'",
            "Make a slideshow from images https://example.com/1.jpg https://example.com/2.jpg",
            "Generate data visualization video from numbers: 10, 20, 30, 40, 50",
            "Trim video video.mp4 from 10s to 30s",
            "Extract frames from video.mp4 at 2 frames per second",
            "Create GIF animation from text 'Loading...'"
        ];
    }
}

module.exports = VideoGenerator;

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class SpeechSynthesis {
    constructor() {
        this.name = "speech_synthesis";
        this.description = "Convert text to speech and generate audio files";
        this.version = "1.0.0";
        this.supportedVoices = ['en-US', 'en-GB', 'es-ES', 'fr-FR', 'de-DE'];
        this.tempDir = path.join(__dirname, '../temp/audio');
        
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }
    
    async execute(text, options = {}) {
        try {
            const voice = options.voice || 'en-US';
            const speed = options.speed || 1.0;
            const format = options.format || 'mp3';
            const timestamp = Date.now();
            
            const outputFile = path.join(this.tempDir, `speech_${timestamp}.${format}`);
            
            // Using gTTS (Google Text-to-Speech) via command line
            await this.generateSpeech(text, voice, speed, outputFile);
            
            // Get file stats
            const stats = fs.statSync(outputFile);
            
            return {
                success: true,
                text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
                audioFile: outputFile,
                audioUrl: `/audio/${path.basename(outputFile)}`,
                voice: voice,
                speed: speed,
                format: format,
                fileSize: this.formatFileSize(stats.size),
                duration: await this.getAudioDuration(outputFile),
                source: this.name,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                text: text,
                source: this.name
            };
        }
    }
    
    async generateSpeech(text, voice, speed, outputFile) {
        // Using gtts-cli (must be installed: pip install gtts)
        const lang = voice.split('-')[0];
        
        const command = `gtts-cli '${text.replace(/'/g, "'\"'\"'")}' --lang ${lang} --output ${outputFile}`;
        
        try {
            await execPromise(command);
        } catch (error) {
            // Fallback to festival if gtts not available
            await this.festivalTTS(text, outputFile);
        }
    }
    
    async festivalTTS(text, outputFile) {
        const command = `echo "${text}" | text2wave -o ${outputFile}`;
        await execPromise(command);
    }
    
    async getAudioDuration(filePath) {
        try {
            const { stdout } = await execPromise(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${filePath}`);
            return parseFloat(stdout).toFixed(2) + 's';
        } catch {
            return 'unknown';
        }
    }
    
    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Byte';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    }
    
    async listVoices() {
        return {
            success: true,
            voices: this.supportedVoices.map(voice => ({
                code: voice,
                language: this.getLanguageName(voice),
                gender: 'neutral'
            }))
        };
    }
    
    getLanguageName(code) {
        const languages = {
            'en-US': 'English (US)',
            'en-GB': 'English (UK)',
            'es-ES': 'Spanish',
            'fr-FR': 'French',
            'de-DE': 'German',
            'it-IT': 'Italian',
            'ja-JP': 'Japanese',
            'ko-KR': 'Korean',
            'zh-CN': 'Chinese'
        };
        return languages[code] || code;
    }
    
    async batchGenerate(texts, options = {}) {
        const results = [];
        
        for (let i = 0; i < texts.length; i++) {
            const result = await this.execute(texts[i], { ...options, index: i });
            results.push(result);
        }
        
        return {
            success: true,
            batchResults: results,
            totalFiles: results.filter(r => r.success).length,
            source: this.name
        };
    }
}

module.exports = SpeechSynthesis;

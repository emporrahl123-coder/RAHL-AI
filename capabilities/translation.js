const axios = require('axios');

class Translation {
    constructor() {
        this.name = "translation";
        this.description = "Translate text between multiple languages";
        this.version = "1.0.0";
        this.supportedLanguages = {
            'en': 'English',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'it': 'Italian',
            'pt': 'Portuguese',
            'ru': 'Russian',
            'zh': 'Chinese',
            'ja': 'Japanese',
            'ko': 'Korean',
            'ar': 'Arabic',
            'hi': 'Hindi'
        };
    }
    
    async execute(text, options = {}) {
        try {
            const targetLang = options.target || 'en';
            const sourceLang = options.source || 'auto';
            
            if (!this.supportedLanguages[targetLang]) {
                throw new Error(`Unsupported target language: ${targetLang}`);
            }
            
            const translation = await this.translateText(text, sourceLang, targetLang);
            const detectedLang = await this.detectLanguage(text);
            
            return {
                success: true,
                originalText: text,
                translatedText: translation,
                sourceLanguage: this.supportedLanguages[detectedLang] || detectedLang,
                targetLanguage: this.supportedLanguages[targetLang],
                characterCount: text.length,
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
    
    async translateText(text, sourceLang, targetLang) {
        // Try Google Translate API first
        try {
            return await this.googleTranslate(text, sourceLang, targetLang);
        } catch (error) {
            // Fallback to LibreTranslate
            return await this.libretranslate(text, sourceLang, targetLang);
        }
    }
    
    async googleTranslate(text, sourceLang, targetLang) {
        const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
        
        if (!apiKey) {
            throw new Error('Google Translate API key not configured');
        }
        
        const response = await axios.post(
            `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
            {
                q: text,
                source: sourceLang,
                target: targetLang,
                format: 'text'
            }
        );
        
        return response.data.data.translations[0].translatedText;
    }
    
    async libretranslate(text, sourceLang, targetLang) {
        const response = await axios.post('https://libretranslate.com/translate', {
            q: text,
            source: sourceLang === 'auto' ? 'auto' : sourceLang,
            target: targetLang,
            format: 'text',
            api_key: process.env.LIBRE_TRANSLATE_API_KEY || ''
        });
        
        return response.data.translatedText;
    }
    
    async detectLanguage(text) {
        try {
            // Using Google Translate detection
            const response = await axios.post(
                `https://translation.googleapis.com/language/translate/v2/detect?key=${process.env.GOOGLE_TRANSLATE_API_KEY || ''}`,
                {
                    q: text
                }
            );
            
            return response.data.data.detections[0][0].language;
        } catch (error) {
            // Simple detection based on character ranges
            return this.simpleLanguageDetection(text);
        }
    }
    
    simpleLanguageDetection(text) {
        const charRanges = {
            'en': /[a-zA-Z]/,
            'zh': /[\u4e00-\u9fff]/,
            'ja': /[\u3040-\u309f\u30a0-\u30ff]/,
            'ko': /[\uac00-\ud7af]/,
            'ar': /[\u0600-\u06ff]/,
            'ru': /[\u0400-\u04ff]/
        };
        
        for (const [lang, regex] of Object.entries(charRanges)) {
            if (regex.test(text)) {
                return lang;
            }
        }
        
        return 'en'; // Default to English
    }
    
    async batchTranslate(texts, options = {}) {
        const targetLang = options.target || 'en';
        const translations = [];
        
        for (const text of texts) {
            try {
                const translation = await this.translateText(text, 'auto', targetLang);
                translations.push({
                    original: text,
                    translated: translation,
                    success: true
                });
            } catch (error) {
                translations.push({
                    original: text,
                    error: error.message,
                    success: false
                });
            }
        }
        
        return {
            success: true,
            translations: translations,
            targetLanguage: this.supportedLanguages[targetLang],
            totalTranslated: translations.filter(t => t.success).length,
            source: this.name
        };
    }
    
    async getSupportedLanguages() {
        return {
            success: true,
            languages: Object.entries(this.supportedLanguages).map(([code, name]) => ({
                code,
                name,
                nativeName: this.getNativeName(code)
            })),
            count: Object.keys(this.supportedLanguages).length,
            source: this.name
        };
    }
    
    getNativeName(code) {
        const nativeNames = {
            'en': 'English',
            'es': 'Español',
            'fr': 'Français',
            'de': 'Deutsch',
            'it': 'Italiano',
            'pt': 'Português',
            'ru': 'Русский',
            'zh': '中文',
            'ja': '日本語',
            'ko': '한국어',
            'ar': 'العربية',
            'hi': 'हिन्दी'
        };
        
        return nativeNames[code] || code;
    }
    
    async transliterate(text, options = {}) {
        // Convert text to Latin script (for non-Latin languages)
        const targetScript = options.script || 'latin';
        
        // Simple transliteration for common languages
        const transliterationMap = {
            'ru': {
                'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
                'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i',
                'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
                'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
                'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch',
                'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '',
                'э': 'e', 'ю': 'yu', 'я': 'ya'
            },
            'el': {
                'α': 'a', 'β': 'v', 'γ': 'g', 'δ': 'd', 'ε': 'e',
                'ζ': 'z', 'η': 'i', 'θ': 'th', 'ι': 'i', 'κ': 'k',
                'λ': 'l', 'μ': 'm', 'ν': 'n', 'ξ': 'x', 'ο': 'o',
                'π': 'p', 'ρ': 'r', 'σ': 's', 'τ': 't', 'υ': 'y',
                'φ': 'f', 'χ': 'ch', 'ψ': 'ps', 'ω': 'o'
            }
        };
        
        // Detect language
        const detectedLang = await this.detectLanguage(text);
        
        if (transliterationMap[detectedLang]) {
            const map = transliterationMap[detectedLang];
            let result = '';
            
            for (const char of text.toLowerCase()) {
                result += map[char] || char;
            }
            
            return {
                success: true,
                originalText: text,
                transliteratedText: result,
                sourceLanguage: detectedLang,
                targetScript: targetScript,
                source: this.name
            };
        }
        
        return {
            success: false,
            error: `Transliteration not supported for language: ${detectedLang}`,
            text: text,
            source: this.name
        };
    }
}

module.exports = Translation;

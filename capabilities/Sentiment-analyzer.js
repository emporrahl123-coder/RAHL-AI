const natural = require('natural');
const Sentiment = require('sentiment');
const compromise = require('compromise');

class SentimentAnalyzer {
    constructor() {
        this.name = "sentiment_analyzer";
        this.description = "Analyze sentiment, emotions, and tone in text";
        this.version = "1.0.0";
        this.sentiment = new Sentiment();
        this.tokenizer = new natural.WordTokenizer();
        this.classifier = new natural.BayesClassifier();
        
        // Initialize with some training data
        this.initializeClassifier();
    }
    
    async execute(text, options = {}) {
        try {
            const analysis = {
                sentiment: await this.analyzeSentiment(text),
                emotions: await this.detectEmotions(text),
                entities: await this.extractEntities(text),
                keywords: await this.extractKeywords(text),
                readability: this.calculateReadability(text),
                tone: this.analyzeTone(text)
            };
            
            return {
                success: true,
                text: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
                analysis: analysis,
                summary: this.generateSummary(analysis),
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
    
    async analyzeSentiment(text) {
        const result = this.sentiment.analyze(text);
        
        // Enhanced analysis
        const words = this.tokenizer.tokenize(text.toLowerCase());
        const positiveWords = result.positive || [];
        const negativeWords = result.negative || [];
        const neutralWords = words.filter(word => 
            !positiveWords.includes(word) && !negativeWords.includes(word)
        );
        
        return {
            score: result.score,
            comparative: result.comparative,
            category: this.getSentimentCategory(result.score),
            positiveWords: positiveWords,
            negativeWords: negativeWords,
            neutralWords: neutralWords.slice(0, 10),
            wordCount: words.length
        };
    }
    
    getSentimentCategory(score) {
        if (score > 2) return 'Very Positive';
        if (score > 0) return 'Positive';
        if (score === 0) return 'Neutral';
        if (score > -2) return 'Negative';
        return 'Very Negative';
    }
    
    async detectEmotions(text) {
        const emotionKeywords = {
            joy: ['happy', 'joy', 'excited', 'great', 'wonderful', 'love', 'amazing'],
            sadness: ['sad', 'unhappy', 'depressed', 'miserable', 'cry', 'tears'],
            anger: ['angry', 'mad', 'furious', 'rage', 'hate', 'annoyed'],
            fear: ['scared', 'afraid', 'fear', 'terrified', 'anxious', 'worried'],
            surprise: ['surprised', 'shocked', 'amazed', 'astonished', 'unexpected'],
            disgust: ['disgust', 'gross', 'nasty', 'revolting', 'sickening']
        };
        
        const words = this.tokenizer.tokenize(text.toLowerCase());
        const emotions = {};
        
        for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
            const count = keywords.filter(keyword => 
                words.some(word => word.includes(keyword))
            ).length;
            
            if (count > 0) {
                emotions[emotion] = {
                    score: count,
                    intensity: Math.min(count / 3, 1) // Normalize to 0-1
                };
            }
        }
        
        // Get dominant emotion
        const dominantEmotion = Object.entries(emotions)
            .sort(([, a], [, b]) => b.score - a.score)[0];
        
        return {
            emotions: emotions,
            dominant: dominantEmotion ? {
                emotion: dominantEmotion[0],
                score: dominantEmotion[1].score,
                intensity: dominantEmotion[1].intensity
            } : null,
            emotionCount: Object.keys(emotions).length
        };
    }
    
    async extractEntities(text) {
        const doc = compromise(text);
        
        return {
            people: doc.people().out('array'),
            places: doc.places().out('array'),
            organizations: doc.organizations().out('array'),
            dates: doc.dates().out('array'),
            numbers: doc.numbers().out('array'),
            money: doc.money().out('array'),
            email: this.extractEmails(text),
            urls: this.extractUrls(text),
            hashtags: this.extractHashtags(text),
            mentions: this.extractMentions(text)
        };
    }
    
    extractEmails(text) {
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        return text.match(emailRegex) || [];
    }
    
    extractUrls(text) {
        const urlRegex = /https?:\/\/[^\s]+/g;
        return text.match(urlRegex) || [];
    }
    
    extractHashtags(text) {
        const hashtagRegex = /#(\w+)/g;
        const matches = text.match(hashtagRegex) || [];
        return matches.map(tag => tag.substring(1));
    }
    
    extractMentions(text) {
        const mentionRegex = /@(\w+)/g;
        const matches = text.match(mentionRegex) || [];
        return matches.map(mention => mention.substring(1));
    }
    
    async extractKeywords(text, options = {}) {
        const maxKeywords = options.maxKeywords || 10;
        const words = this.tokenizer.tokenize(text.toLowerCase());
        
        // Remove stop words
        const stopWords = new Set([
            'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to',
            'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be',
            'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did'
        ]);
        
        const filteredWords = words.filter(word => 
            word.length > 2 && !stopWords.has(word)
        );
        
        // Calculate frequency
        const frequency = {};
        filteredWords.forEach(word => {
            frequency[word] = (frequency[word] || 0) + 1;
        });
        
        // Sort by frequency
        const sortedKeywords = Object.entries(frequency)
            .sort(([, a], [, b]) => b - a)
            .slice(0, maxKeywords)
            .map(([word, count]) => ({
                word,
                frequency: count,
                importance: count / filteredWords.length
            }));
        
        // Calculate TF-IDF like scores
        const totalDocs = 1000; // Simulated document count
        const docFrequency = {}; // Would come from a real corpus
        
        const keywordsWithScore = sortedKeywords.map(keyword => ({
            ...keyword,
            tfidfScore: keyword.frequency * Math.log(totalDocs / (docFrequency[keyword.word] || 1))
        }));
        
        return keywordsWithScore;
    }
    
    calculateReadability(text) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const words = this.tokenizer.tokenize(text);
        const syllables = this.countSyllables(text);
        
        // Flesch Reading Ease
        const fleschScore = 206.835 - 
            (1.015 * (words.length / sentences.length)) - 
            (84.6 * (syllables / words.length));
        
        // Flesch-Kincaid Grade Level
        const gradeLevel = 0.39 * (words.length / sentences.length) +
            11.8 * (syllables / words.length) - 15.59;
        
        // Automated Readability Index
        const ari = 4.71 * (text.length / words.length) +
            0.5 * (words.length / sentences.length) - 21.43;
        
        return {
            fleschScore: Math.round(fleschScore * 100) / 100,
            gradeLevel: Math.round(gradeLevel * 100) / 100,
            ari: Math.round(ari * 100) / 100,
            readingEase: this.getReadingEase(fleschScore),
            sentenceCount: sentences.length,
            wordCount: words.length,
            averageSentenceLength: words.length / sentences.length
        };
    }
    
    countSyllables(text) {
        // Simple syllable counting algorithm
        const words = this.tokenizer.tokenize(text.toLowerCase());
        let syllableCount = 0;
        
        words.forEach(word => {
            // Remove silent 'e' at the end
            word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
            
            // Count vowel groups
            const vowelGroups = word.match(/[aeiouy]{1,2}/g);
            syllableCount += vowelGroups ? vowelGroups.length : 1;
        });
        
        return syllableCount;
    }
    
    getReadingEase(score) {
        if (score >= 90) return 'Very Easy (5th grader)';
        if (score >= 80) return 'Easy (6th grader)';
        if (score >= 70) return 'Fairly Easy (7th grader)';
        if (score >= 60) return 'Standard (8th-9th grader)';
        if (score >= 50) return 'Fairly Difficult (10th-12th grader)';
        if (score >= 30) return 'Difficult (College student)';
        return 'Very Difficult (College graduate)';
    }
    
    analyzeTone(text) {
        const tones = {
            formal: this.isFormal(text),
            casual: this.isCasual(text),
            persuasive: this.isPersuasive(text),
            informative: this.isInformative(text),
            emotional: this.isEmotional(text),
            technical: this.isTechnical(text)
        };
        
        const activeTones = Object.entries(tones)
            .filter(([, isActive]) => isActive)
            .map(([tone]) => tone);
        
        return {
            tones: activeTones,
            formality: this.calculateFormality(text),
            subjectivity: this.calculateSubjectivity(text)
        };
    }
    
    isFormal(text) {
        const formalIndicators = ['shall', 'must', 'therefore', 'however', 'furthermore'];
        return formalIndicators.some(indicator => text.includes(indicator));
    }
    
    isCasual(text) {
        const casualIndicators = ['hey', 'lol', 'omg', 'btw', 'imo'];
        return casualIndicators.some(indicator => 
            text.toLowerCase().includes(indicator)
        );
    }
    
    isPersuasive(text) {
        const persuasiveWords = ['should', 'must', 'need to', 'recommend', 'suggest'];
        return persuasiveWords.some(word => text.toLowerCase().includes(word));
    }
    
    isInformative(text) {
        const informativeWords = ['according to', 'research shows', 'study found', 'data indicates'];
        return informativeWords.some(phrase => text.toLowerCase().includes(phrase));
    }
    
    isEmotional(text) {
        const emotionWords = ['feel', 'believe', 'think', 'hope', 'wish'];
        const words = this.tokenizer.tokenize(text.toLowerCase());
        return emotionWords.some(word => words.includes(word));
    }
    
    isTechnical(text) {
        const technicalIndicators = ['algorithm', 'function', 'parameter', 'variable', 'database'];
        return technicalIndicators.some(indicator => text.toLowerCase().includes(indicator));
    }
    
    calculateFormality(text) {
        // Simple formality score based on various factors
        let score = 0.5; // Neutral
        
        if (this.isFormal(text)) score += 0.3;
        if (this.isCasual(text)) score -= 0.3;
        if (this.isTechnical(text)) score += 0.2;
        
        return Math.max(0, Math.min(1, score));
    }
    
    calculateSubjectivity(text) {
        const sentiment = this.sentiment.analyze(text);
        // Convert sentiment score to subjectivity (0 = objective, 1 = subjective)
        return Math.min(1, Math.abs(sentiment.comparative) * 10);
    }
    
    generateSummary(analysis) {
        const { sentiment, emotions, readability, tone } = analysis;
        
        const summary = [];
        
        summary.push(`Sentiment: ${sentiment.category} (score: ${sentiment.score})`);
        
        if (emotions.dominant) {
            summary.push(`Dominant emotion: ${emotions.dominant.emotion} (intensity: ${emotions.dominant.intensity.toFixed(2)})`);
        }
        
        summary.push(`Readability: ${readability.readingEase}`);
        summary.push(`Formality: ${(tone.formality * 100).toFixed(0)}%`);
        summary.push(`Subjectivity: ${(tone.subjectivity * 100).toFixed(0)}%`);
        
        if (tone.tones.length > 0) {
            summary.push(`Tones detected: ${tone.tones.join(', ')}`);
        }
        
        return summary.join(' | ');
    }
    
    initializeClassifier() {
        // Training data for text classification
        const trainingData = [
            { text: 'I love this product!', category: 'positive' },
            { text: 'This is amazing!', category: 'positive' },
            { text: 'Great job!', category: 'positive' },
            { text: 'I hate this', category: 'negative' },
            { text: 'This is terrible', category: 'negative' },
            { text: 'Very disappointing', category: 'negative' },
            { text: 'It is okay', category: 'neutral' },
            { text: 'Not bad', category: 'neutral' },
            { text: 'Average product', category: 'neutral' }
        ];
        
        trainingData.forEach(data => {
            this.classifier.addDocument(data.text, data.category);
        });
        
        this.classifier.train();
    }
    
    async classifyText(text) {
        const classification = this.classifier.classify(text);
        const classifications = this.classifier.getClassifications(text);
        
        return {
            category: classification,
            confidence: Math.max(...classifications.map(c => c.value)),
            allClassifications: classifications.map(c => ({
                category: c.label,
                confidence: c.value
            }))
        };
    }
    
    async batchAnalyze(texts) {
        const results = [];
        
        for (const text of texts) {
            try {
                const analysis = await this.execute(text);
                results.push({
                    text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
                    ...analysis
                });
            } catch (error) {
                results.push({
                    text: text.substring(0, 100),
                    error: error.message,
                    success: false
                });
            }
        }
        
        return {
            success: true,
            analyses: results,
            totalAnalyzed: results.filter(r => r.success !== false).length,
            source: this.name
        };
    }
}

module.exports = SentimentAnalyzer;

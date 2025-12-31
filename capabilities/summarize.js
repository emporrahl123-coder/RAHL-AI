const natural = require('natural');
const { TfIdf } = require('natural');

class Summarizer {
    constructor() {
        this.name = "summarizer";
        this.description = "Summarize long text documents";
        this.version = "1.0.0";
        this.tokenizer = new natural.SentenceTokenizer();
        this.wordTokenizer = new natural.WordTokenizer();
        this.stemmer = natural.PorterStemmer;
    }
    
    async execute(text, options = {}) {
        try {
            const summaryType = options.type || 'extractive';
            const length = options.length || 'medium'; // short, medium, long
            const ratio = options.ratio || 0.3; // 0-1 ratio of original
            
            let summary;
            
            switch(summaryType) {
                case 'extractive':
                    summary = await this.extractiveSummary(text, length, ratio);
                    break;
                case 'abstractive':
                    summary = await this.abstractiveSummary(text, length);
                    break;
                case 'bullet':
                    summary = await this.bulletPointSummary(text, length);
                    break;
                case 'one_line':
                    summary = await this.oneLineSummary(text);
                    break;
                default:
                    summary = await this.extractiveSummary(text, length, ratio);
            }
            
            // Calculate reduction
            const originalWords = this.wordTokenizer.tokenize(text).length;
            const summaryWords = this.wordTokenizer.tokenize(summary.text).length;
            const reduction = ((originalWords - summaryWords) / originalWords * 100).toFixed(1);
            
            return {
                success: true,
                originalText: text.substring(0, 500) + (text.length > 500 ? '...' : ''),
                summary: summary.text,
                type: summaryType,
                length: length,
                statistics: {
                    originalLength: text.length,
                    originalWords: originalWords,
                    summaryLength: summary.text.length,
                    summaryWords: summaryWords,
                    reductionPercentage: reduction + '%',
                    compressionRatio: (summaryWords / originalWords).toFixed(3)
                },
                keywords: summary.keywords || [],
                topics: summary.topics || [],
                source: this.name,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                text: text.substring(0, 200),
                source: this.name
            };
        }
    }
    
    async extractiveSummary(text, length, ratio) {
        const sentences = this.tokenizer.tokenize(text);
        
        if (sentences.length <= 3) {
            return {
                text: text,
                keywords: [],
                topics: []
            };
        }
        
        // Calculate sentence scores using TF-IDF
        const tfidf = new TfIdf();
        const sentenceVectors = [];
        
        // Add each sentence as a document
        sentences.forEach(sentence => {
            const words = this.preprocessSentence(sentence);
            tfidf.addDocument(words);
        });
        
        // Calculate scores for each sentence
        const sentenceScores = sentences.map((sentence, index) => {
            const words = this.preprocessSentence(sentence);
            let score = 0;
            
            words.forEach(word => {
                tfidf.tfidf(word, index, (idf, tf) => {
                    score += tf * idf;
                });
            });
            
            // Bonus for position (first and last sentences are often important)
            if (index === 0) score *= 1.5;
            if (index === sentences.length - 1) score *= 1.3;
            
            // Bonus for question sentences
            if (sentence.includes('?')) score *= 1.2;
            
            // Bonus for sentences with numbers (often contain facts)
            if (/\d+/.test(sentence)) score *= 1.1;
            
            return {
                sentence,
                index,
                score,
                length: words.length
            };
        });
        
        // Sort by score
        sentenceScores.sort((a, b) => b.score - a.score);
        
        // Determine how many sentences to include
        let sentenceCount;
        switch(length) {
            case 'short':
                sentenceCount = Math.max(1, Math.floor(sentences.length * 0.1));
                break;
            case 'medium':
                sentenceCount = Math.max(2, Math.floor(sentences.length * ratio));
                break;
            case 'long':
                sentenceCount = Math.max(3, Math.floor(sentences.length * 0.5));
                break;
            default:
                sentenceCount = Math.max(2, Math.floor(sentences.length * ratio));
        }
        
        // Take top sentences
        const topSentences = sentenceScores.slice(0, sentenceCount);
        
        // Sort by original position
        topSentences.sort((a, b) => a.index - b.index);
        
        // Extract keywords
        const keywords = this.extractKeywords(text, 10);
        
        // Extract topics
        const topics = this.extractTopics(text);
        
        return {
            text: topSentences.map(s => s.sentence).join(' '),
            keywords: keywords,
            topics: topics,
            sentenceScores: sentenceScores.slice(0, 5).map(s => ({
                sentence: s.sentence.substring(0, 100) + '...',
                score: s.score.toFixed(3)
            }))
        };
    }
    
    preprocessSentence(sentence) {
        // Tokenize, lowercase, remove stop words, and stem
        const words = this.wordTokenizer.tokenize(sentence.toLowerCase());
        const stopWords = new Set([
            'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to',
            'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be',
            'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
            'i', 'you', 'he', 'she', 'it', 'we', 'they'
        ]);
        
        return words
            .filter(word => word.length > 2 && !stopWords.has(word))
            .map(word => this.stemmer.stem(word));
    }
    
    extractKeywords(text, count = 10) {
        const words = this.preprocessSentence(text);
        const frequency = {};
        
        words.forEach(word => {
            frequency[word] = (frequency[word] || 0) + 1;
        });
        
        return Object.entries(frequency)
            .sort(([, a], [, b]) => b - a)
            .slice(0, count)
            .map(([word, freq]) => ({
                word,
                frequency: freq,
                importance: freq / words.length
            }));
    }
    
    extractTopics(text) {
        const sentences = this.tokenizer.tokenize(text);
        const topics = new Set();
        
        // Look for topic indicators
        sentences.forEach(sentence => {
            // Check for topic sentences (often start with "The topic", "This discusses", etc.)
            if (sentence.toLowerCase().match(/^(the|this|our|in this|we discuss)/)) {
                const words = this.wordTokenizer.tokenize(sentence);
                if (words.length > 3 && words.length < 15) {
                    topics.add(sentence);
                }
            }
        });
        
        return Array.from(topics).slice(0, 3);
    }
    
    async abstractiveSummary(text, length) {
        // This would use a transformer model in production
        // For now, using a hybrid approach
        
        const sentences = this.tokenizer.tokenize(text);
        
        if (sentences.length <= 2) {
            return {
                text: text,
                keywords: []
            };
        }
        
        // Simple abstractive approach: paraphrase key sentences
        const keySentences = sentences.slice(0, Math.min(3, sentences.length));
        const paraphrased = keySentences.map(sentence => 
            this.paraphraseSentence(sentence)
        );
        
        return {
            text: paraphrased.join(' '),
            keywords: this.extractKeywords(text, 5)
        };
    }
    
    paraphraseSentence(sentence) {
        // Simple paraphrasing rules
        const paraphrases = {
            'is': 'can be described as',
            'are': 'can be considered as',
            'was': 'has been',
            'were': 'have been',
            'very': 'extremely',
            'big': 'large',
            'small': 'compact',
            'good': 'excellent',
            'bad': 'poor',
            'important': 'crucial',
            'many': 'numerous'
        };
        
        let paraphrased = sentence;
        
        Object.entries(paraphrases).forEach(([original, replacement]) => {
            const regex = new RegExp(`\\b${original}\\b`, 'gi');
            paraphrased = paraphrased.replace(regex, replacement);
        });
        
        return paraphrased;
    }
    
    async bulletPointSummary(text, length) {
        const sentences = this.tokenizer.tokenize(text);
        const sentenceCount = Math.min(
            length === 'short' ? 3 : length === 'medium' ? 5 : 7,
            sentences.length
        );
        
        const keySentences = sentences.slice(0, sentenceCount);
        
        // Convert to bullet points
        const bulletPoints = keySentences.map(sentence => {
            // Clean up the sentence
            let clean = sentence.trim();
            
            // Capitalize first letter
            clean = clean.charAt(0).toUpperCase() + clean.slice(1);
            
            // Remove ending punctuation if present
            if (clean.endsWith('.') || clean.endsWith('!') || clean.endsWith('?')) {
                clean = clean.slice(0, -1);
            }
            
            return `• ${clean}`;
        });
        
        return {
            text: bulletPoints.join('\n'),
            keywords: this.extractKeywords(text, 5)
        };
    }
    
    async oneLineSummary(text) {
        const sentences = this.tokenizer.tokenize(text);
        
        if (sentences.length === 0) {
            return {
                text: 'No content to summarize.',
                keywords: []
            };
        }
        
        // Find the most "summary-like" sentence
        const summaryCandidates = sentences.filter(sentence => {
            const words = sentence.split(' ');
            return words.length >= 5 && words.length <= 20;
        });
        
        if (summaryCandidates.length > 0) {
            // Take the first sentence that's a good length
            return {
                text: summaryCandidates[0],
                keywords: this.extractKeywords(text, 3)
            };
        }
        
        // Fallback to first sentence
        return {
            text: sentences[0],
            keywords: this.extractKeywords(text, 3)
        };
    }
    
    async summarizeDocument(filePath, options = {}) {
        // This would read different document formats
        // For now, assuming text file
        const fs = require('fs');
        
        try {
            const text = fs.readFileSync(filePath, 'utf8');
            return await this.execute(text, options);
        } catch (error) {
            return {
                success: false,
                error: `Failed to read document: ${error.message}`,
                filePath: filePath
            };
        }
    }
    
    async batchSummarize(texts, options = {}) {
        const summaries = [];
        
        for (let i = 0; i < texts.length; i++) {
            try {
                const summary = await this.execute(texts[i], options);
                summaries.push({
                    index: i,
                    originalLength: texts[i].length,
                    ...summary
                });
            } catch (error) {
                summaries.push({
                    index: i,
                    error: error.message,
                    success: false
                });
            }
        }
        
        return {
            success: true,
            summaries: summaries,
            totalSummarized: summaries.filter(s => s.success !== false).length,
            averageReduction: this.calculateAverageReduction(summaries),
            source: this.name
        };
    }
    
    calculateAverageReduction(summaries) {
        const validSummaries = summaries.filter(s => s.statistics);
        if (validSummaries.length === 0) return '0%';
        
        const totalReduction = validSummaries.reduce((sum, s) => {
            const reduction = parseFloat(s.statistics.reductionPercentage);
            return sum + (isNaN(reduction) ? 0 : reduction);
        }, 0);
        
        return (totalReduction / validSummaries.length).toFixed(1) + '%';
    }
    
    async generateExecutiveSummary(text, options = {}) {
        // Generate a professional executive summary
        const summary = await this.extractiveSummary(text, 'medium', 0.2);
        
        const executiveTemplate = `EXECUTIVE SUMMARY
        
Key Findings:
${summary.keywords.slice(0, 5).map(kw => `- ${kw.word} (relevance: ${(kw.importance * 100).toFixed(1)}%)`).join('\n')}

Summary:
${summary.text}

Main Topics Discussed:
${summary.topics.map(topic => `• ${topic}`).join('\n')}

Word Count: ${this.wordTokenizer.tokenize(summary.text).length} words
Original Length: ${text.length} characters`;

        return {
            success: true,
            summary: executiveTemplate,
            type: 'executive',
            format: 'structured',
            source: this.name
        };
    }
}

module.exports = Summarizer;

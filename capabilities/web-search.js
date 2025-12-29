// capabilities/web-search.js
const axios = require('axios');
const cheerio = require('cheerio');

class WebSearch {
    constructor() {
        this.name = "web_search";
        this.description = "Search the web for information";
    }
    
    async execute(query, options = {}) {
        try {
            // Use Google Custom Search API or DuckDuckGo
            const searchResults = await this.googleSearch(query);
            
            return {
                success: true,
                query: query,
                results: searchResults.slice(0, 5),
                source: 'web_search'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                query: query
            };
        }
    }
    
    async googleSearch(query) {
        // Using DuckDuckGo HTML scraping (no API key needed)
        const response = await axios.get(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const $ = cheerio.load(response.data);
        const results = [];
        
        $('.result').each((i, element) => {
            const title = $(element).find('.result__title').text().trim();
            const link = $(element).find('.result__url').text().trim();
            const snippet = $(element).find('.result__snippet').text().trim();
            
            if (title && link) {
                results.push({
                    title,
                    link: link.startsWith('http') ? link : `https://${link}`,
                    snippet: snippet || 'No description available',
                    rank: i + 1
                });
            }
        });
        
        return results;
    }
    
    async bingSearch(query, apiKey) {
        // Bing Search API implementation
        const response = await axios.get('https://api.bing.microsoft.com/v7.0/search', {
            params: { q: query, count: 5 },
            headers: { 'Ocp-Apim-Subscription-Key': apiKey }
        });
        
        return response.data.webPages.value.map(item => ({
            title: item.name,
            link: item.url,
            snippet: item.snippet
        }));
    }
}

module.exports = WebSearch;

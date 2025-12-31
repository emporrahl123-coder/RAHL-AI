const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class WebScraper {
    constructor() {
        this.name = "web_scraper";
        this.description = "Advanced web scraping and data extraction";
        this.version = "1.0.0";
        this.tempDir = path.join(__dirname, '../temp/scraped');
        
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }
    
    async execute(url, options = {}) {
        try {
            const method = options.method || 'cheerio';
            const timestamp = Date.now();
            
            let result;
            
            switch(method) {
                case 'cheerio':
                    result = await this.scrapeWithCheerio(url, options);
                    break;
                case 'puppeteer':
                    result = await this.scrapeWithPuppeteer(url, options);
                    break;
                case 'api':
                    result = await this.scrapeAPI(url, options);
                    break;
                case 'sitemap':
                    result = await this.scrapeSitemap(url, options);
                    break;
                default:
                    result = await this.scrapeWithCheerio(url, options);
            }
            
            // Save results if requested
            if (options.save) {
                const outputPath = path.join(this.tempDir, `scrape_${timestamp}.json`);
                fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
                result.filePath = outputPath;
            }
            
            return {
                success: true,
                url: url,
                method: method,
                ...result,
                source: this.name,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                url: url,
                source: this.name
            };
        }
    }
    
    async scrapeWithCheerio(url, options = {}) {
        const headers = {
            'User-Agent': options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        };
        
        const response = await axios.get(url, { 
            headers,
            timeout: options.timeout || 30000
        });
        
        const $ = cheerio.load(response.data);
        
        const data = {
            title: $('title').text().trim(),
            description: $('meta[name="description"]').attr('content') || '',
            keywords: $('meta[name="keywords"]').attr('content') || '',
            url: url,
            status: response.status,
            contentType: response.headers['content-type'],
            
            // Extract structured data
            headings: this.extractHeadings($),
            paragraphs: this.extractParagraphs($, options.maxParagraphs || 10),
            links: this.extractLinks($, url),
            images: this.extractImages($, url),
            tables: this.extractTables($),
            lists: this.extractLists($),
            
            // Extract metadata
            metaTags: this.extractMetaTags($),
            openGraph: this.extractOpenGraph($),
            twitterCards: this.extractTwitterCards($),
            jsonLd: this.extractJsonLd($),
            
            // Technical data
            language: $('html').attr('lang') || '',
            charset: $('meta[charset]').attr('charset') || response.headers['content-type'].split('charset=')[1] || '',
            viewport: $('meta[name="viewport"]').attr('content') || ''
        };
        
        // Extract specific elements if selectors provided
        if (options.selectors) {
            data.customSelectors = {};
            for (const [key, selector] of Object.entries(options.selectors)) {
                data.customSelectors[key] = $(selector).map((i, el) => $(el).text().trim()).get();
            }
        }
        
        // Calculate statistics
        data.statistics = {
            totalLinks: data.links.length,
            totalImages: data.images.length,
            wordCount: this.countWords($('body').text()),
            characterCount: $('body').text().length,
            headingCount: Object.values(data.headings).reduce((sum, arr) => sum + arr.length, 0),
            paragraphCount: data.paragraphs.length
        };
        
        return data;
    }
    
    async scrapeWithPuppeteer(url, options = {}) {
        const browser = await puppeteer.launch({
            headless: options.headless !== false,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        try {
            const page = await browser.newPage();
            
            // Set headers
            if (options.headers) {
                await page.setExtraHTTPHeaders(options.headers);
            }
            
            // Set viewport
            await page.setViewport({
                width: options.viewportWidth || 1280,
                height: options.viewportHeight || 800
            });
            
            // Navigate to page
            await page.goto(url, {
                waitUntil: options.waitUntil || 'networkidle2',
                timeout: options.timeout || 30000
            });
            
            // Wait for selectors if specified
            if (options.waitFor) {
                await page.waitForSelector(options.waitFor, { timeout: 10000 });
            }
            
            // Execute JavaScript on page if needed
            let pageData = {};
            if (options.evaluate) {
                pageData = await page.evaluate(options.evaluate);
            }
            
            // Take screenshot if requested
            let screenshot;
            if (options.screenshot) {
                screenshot = await page.screenshot({
                    path: path.join(this.tempDir, `screenshot_${Date.now()}.png`),
                    fullPage: options.fullPage || false
                });
            }
            
            // Get page content
            const content = await page.content();
            const $ = cheerio.load(content);
            
            const data = {
                ...this.scrapeWithCheerio(url, options),
                pageData: pageData,
                screenshot: screenshot ? path.basename(screenshot) : null,
                consoleLogs: await this.getConsoleLogs(page),
                networkRequests: await this.getNetworkRequests(page),
                performanceMetrics: await this.getPerformanceMetrics(page)
            };
            
            return data;
            
        } finally {
            await browser.close();
        }
    }
    
    async scrapeAPI(url, options = {}) {
        const config = {
            method: options.method || 'GET',
            url: url,
            headers: options.headers || {
                'User-Agent': 'RAHL-Web-Scraper/1.0',
                'Accept': 'application/json'
            },
            params: options.params,
            data: options.data,
            timeout: options.timeout || 30000
        };
        
        const response = await axios(config);
        
        return {
            data: response.data,
            status: response.status,
            headers: response.headers,
            config: {
                url: url,
                method: config.method,
                params: config.params
            },
            size: JSON.stringify(response.data).length
        };
    }
    
    async scrapeSitemap(url, options = {}) {
        // Normalize URL to sitemap
        let sitemapUrl = url;
        if (!url.includes('sitemap')) {
            sitemapUrl = new URL('/sitemap.xml', url).href;
        }
        
        try {
            const response = await axios.get(sitemapUrl);
            const $ = cheerio.load(response.data, { xmlMode: true });
            
            const urls = [];
            
            // Extract URLs from sitemap
            $('urlset url loc').each((i, elem) => {
                urls.push($(elem).text().trim());
            });
            
            $('sitemap loc').each((i, elem) => {
                // This is a sitemap index, recursively scrape
                const nestedSitemap = $(elem).text().trim();
                // In production, would recursively scrape nested sitemaps
                urls.push(`[Sitemap Index]: ${nestedSitemap}`);
            });
            
            // Scrape a sample of URLs if requested
            let sampleData = [];
            if (options.sample && urls.length > 0) {
                const sampleSize = Math.min(options.sampleSize || 5, urls.length);
                const sampleUrls = urls.slice(0, sampleSize).filter(u => !u.includes('[Sitemap Index]'));
                
                for (const sampleUrl of sampleUrls) {
                    try {
                        const pageData = await this.scrapeWithCheerio(sampleUrl, { ...options, method: 'cheerio' });
                        sampleData.push({
                            url: sampleUrl,
                            title: pageData.title,
                            status: 'success'
                        });
                    } catch (error) {
                        sampleData.push({
                            url: sampleUrl,
                            error: error.message,
                            status: 'failed'
                        });
                    }
                }
            }
            
            return {
                sitemapUrl: sitemapUrl,
                totalUrls: urls.length,
                urls: urls.slice(0, options.maxUrls || 50),
                sampleData: sampleData,
                sitemapType: $('urlset').length > 0 ? 'urlset' : $('sitemapindex').length > 0 ? 'sitemapindex' : 'unknown'
            };
            
        } catch (error) {
            // Try common sitemap locations
            const commonLocations = [
                '/sitemap.xml',
                '/sitemap_index.xml',
                '/sitemap.php',
                '/sitemap.txt',
                '/sitemap/sitemap.xml'
            ];
            
            for (const location of commonLocations) {
                try {
                    const altUrl = new URL(location, url).href;
                    const response = await axios.get(altUrl);
                    return await this.scrapeSitemap(altUrl, options);
                } catch {
                    continue;
                }
            }
            
            throw new Error(`Could not find sitemap at ${url}`);
        }
    }
    
    extractHeadings($) {
        const headings = {
            h1: $('h1').map((i, el) => $(el).text().trim()).get(),
            h2: $('h2').map((i, el) => $(el).text().trim()).get(),
            h3: $('h3').map((i, el) => $(el).text().trim()).get(),
            h4: $('h4').map((i, el) => $(el).text().trim()).get(),
            h5: $('h5').map((i, el) => $(el).text().trim()).get(),
            h6: $('h6').map((i, el) => $(el).text().trim()).get()
        };
        return headings;
    }
    
    extractParagraphs($, max = 10) {
        return $('p').map((i, el) => $(el).text().trim())
            .get()
            .filter(text => text.length > 20)
            .slice(0, max);
    }
    
    extractLinks($, baseUrl) {
        const links = [];
        
        $('a[href]').each((i, el) => {
            const href = $(el).attr('href');
            const text = $(el).text().trim();
            
            if (href && !href.startsWith('javascript:')) {
                let absoluteUrl;
                try {
                    absoluteUrl = new URL(href, baseUrl).href;
                } catch {
                    absoluteUrl = href;
                }
                
                links.push({
                    text: text || '[No text]',
                    url: absoluteUrl,
                    isExternal: !absoluteUrl.includes(new URL(baseUrl).hostname),
                    rel: $(el).attr('rel') || '',
                    target: $(el).attr('target') || '_self'
                });
            }
        });
        
        return links.slice(0, 50); // Limit to 50 links
    }
    
    extractImages($, baseUrl) {
        const images = [];
        
        $('img[src]').each((i, el) => {
            const src = $(el).attr('src');
            const alt = $(el).attr('alt') || '';
            const title = $(el).attr('title') || '';
            
            let absoluteSrc;
            try {
                absoluteSrc = new URL(src, baseUrl).href;
            } catch {
                absoluteSrc = src;
            }
            
            images.push({
                src: absoluteSrc,
                alt: alt,
                title: title,
                width: $(el).attr('width') || '',
                height: $(el).attr('height') || '',
                loading: $(el).attr('loading') || 'eager'
            });
        });
        
        return images.slice(0, 20); // Limit to 20 images
    }
    
    extractTables($) {
        const tables = [];
        
        $('table').each((i, table) => {
            const tableData = {
                caption: $('caption', table).text().trim(),
                headers: [],
                rows: []
            };
            
            // Extract headers
            $('th', table).each((j, th) => {
                tableData.headers.push($(th).text().trim());
            });
            
            // Extract rows
            $('tr', table).each((j, tr) => {
                const row = [];
                $('td', tr).each((k, td) => {
                    row.push($(td).text().trim());
                });
                if (row.length > 0) {
                    tableData.rows.push(row);
                }
            });
            
            if (tableData.headers.length > 0 || tableData.rows.length > 0) {
                tables.push(tableData);
            }
        });
        
        return tables;
    }
    
    extractLists($) {
        const lists = {
            ordered: [],
            unordered: []
        };
        
        $('ol').each((i, ol) => {
            const items = [];
            $('li', ol).each((j, li) => {
                items.push($(li).text().trim());
            });
            if (items.length > 0) {
                lists.ordered.push({
                    items: items,
                    count: items.length
                });
            }
        });
        
        $('ul').each((i, ul) => {
            const items = [];
            $('li', ul).each((j, li) => {
                items.push($(li).text().trim());
            });
            if (items.length > 0) {
                lists.unordered.push({
                    items: items,
                    count: items.length
                });
            }
        });
        
        return lists;
    }
    
    extractMetaTags($) {
        const metaTags = {};
        
        $('meta').each((i, el) => {
            const name = $(el).attr('name') || $(el).attr('property') || $(el).attr('charset');
            const content = $(el).attr('content') || $(el).attr('charset');
            
            if (name && content) {
                metaTags[name] = content;
            }
        });
        
        return metaTags;
    }
    
    extractOpenGraph($) {
        const og = {};
        
        $('meta[property^="og:"]').each((i, el) => {
            const property = $(el).attr('property');
            const content = $(el).attr('content');
            if (property && content) {
                og[property.replace('og:', '')] = content;
            }
        });
        
        return og;
    }
    
    extractTwitterCards($) {
        const twitter = {};
        
        $('meta[name^="twitter:"]').each((i, el) => {
            const name = $(el).attr('name');
            const content = $(el).attr('content');
            if (name && content) {
                twitter[name.replace('twitter:', '')] = content;
            }
        });
        
        return twitter;
    }
    
    extractJsonLd($) {
        const jsonLd = [];
        
        $('script[type="application/ld+json"]').each((i, el) => {
            try {
                const data = JSON.parse($(el).html());
                jsonLd.push(data);
            } catch (error) {
                // Skip invalid JSON
            }
        });
        
        return jsonLd;
    }
    
    countWords(text) {
        return text.split(/\s+/).filter(word => word.length > 0).length;
    }
    
    async getConsoleLogs(page) {
        const logs = [];
        page.on('console', msg => {
            logs.push({
                type: msg.type(),
                text: msg.text(),
                location: msg.location()
            });
        });
        return logs;
    }
    
    async getNetworkRequests(page) {
        const requests = [];
        page.on('request', request => {
            requests.push({
                url: request.url(),
                method: request.method(),
                resourceType: request.resourceType()
            });
        });
        return requests.slice(0, 20); // Limit to 20 requests
    }
    
    async getPerformanceMetrics(page) {
        const metrics = await page.metrics();
        const performance = await page.evaluate(() => {
            const timing = window.performance.timing;
            return {
                loadTime: timing.loadEventEnd - timing.navigationStart,
                domReadyTime: timing.domContentLoadedEventEnd - timing.navigationStart,
                readyStart: timing.fetchStart - timing.navigationStart,
                redirectTime: timing.redirectEnd - timing.redirectStart,
                appcacheTime: timing.domainLookupStart - timing.fetchStart,
                unloadEventTime: timing.unloadEventEnd - timing.unloadEventStart,
                lookupDomainTime: timing.domainLookupEnd - timing.domainLookupStart,
                connectTime: timing.connectEnd - timing.connectStart,
                requestTime: timing.responseEnd - timing.requestStart,
                initDomTreeTime: timing.domInteractive - timing.responseEnd,
                loadEventTime: timing.loadEventEnd - timing.loadEventStart
            };
        });
        
        return {
            ...metrics,
            ...performance
        };
    }
    
    async scrapeMultiple(urls, options = {}) {
        const results = [];
        const errors = [];
        
        const maxConcurrent = options.maxConcurrent || 3;
        
        // Process URLs in batches
        for (let i = 0; i < urls.length; i += maxConcurrent) {
            const batch = urls.slice(i, i + maxConcurrent);
            const batchPromises = batch.map(url => 
                this.execute(url, options).catch(error => ({
                    success: false,
                    url: url,
                    error: error.message
                }))
            );
            
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
        }
        
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);
        
        return {
            success: true,
            totalUrls: urls.length,
            successful: successful.length,
            failed: failed.length,
            results: results.slice(0, options.maxResults || 20),
            summary: {
                averageTitleLength: successful.length > 0 ? 
                    successful.reduce((sum, r) => sum + (r.title?.length || 0), 0) / successful.length : 0,
                totalLinks: successful.reduce((sum, r) => sum + (r.links?.length || 0), 0),
                totalImages: successful.reduce((sum, r) => sum + (r.images?.length || 0), 0)
            },
            source: this.name
        };
    }
    
    async monitorWebsite(url, options = {}) {
        const interval = options.interval || 3600000; // 1 hour default
        const duration = options.duration || 86400000; // 24 hours default
        
        const snapshots = [];
        const startTime = Date.now();
        
        while (Date.now() - startTime < duration) {
            try {
                const snapshot = await this.execute(url, { ...options, method: 'cheerio' });
                snapshots.push({
                    timestamp: new Date().toISOString(),
                    data: snapshot
                });
                
                // Check for changes if we have previous snapshot
                if (snapshots.length > 1) {
                    const previous = snapshots[snapshots.length - 2];
                    const changes = this.detectChanges(previous.data, snapshot);
                    
                    if (changes.hasChanges) {
                        snapshot.changes = changes;
                        
                        // Send notification if configured
                        if (options.notify && changes.significant) {
                            await this.sendNotification(url, changes);
                        }
                    }
                }
                
                // Save snapshot
                const snapshotPath = path.join(this.tempDir, `monitor_${Date.now()}.json`);
                fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));
                
            } catch (error) {
                snapshots.push({
                    timestamp: new Date().toISOString(),
                    error: error.message
                });
            }
            
            // Wait for next interval
            if (Date.now() - startTime < duration) {
                await new Promise(resolve => setTimeout(resolve, interval));
            }
        }
        
        return {
            success: true,
            url: url,
            duration: duration,
            interval: interval,
            totalSnapshots: snapshots.length,
            successfulSnapshots: snapshots.filter(s => !s.error).length,
            snapshots: snapshots,
            source: this.name
        };
    }
    
    detectChanges(oldData, newData) {
        const changes = {
            hasChanges: false,
            significant: false,
            details: {}
        };
        
        // Check title
        if (oldData.title !== newData.title) {
            changes.details.title = {
                old: oldData.title,
                new: newData.title
            };
            changes.hasChanges = true;
            changes.significant = true;
        }
        
        // Check word count
        const oldWordCount = oldData.statistics?.wordCount || 0;
        const newWordCount = newData.statistics?.wordCount || 0;
        const wordCountChange = Math.abs(newWordCount - oldWordCount);
        
        if (wordCountChange > 100) {
            changes.details.wordCount = {
                old: oldWordCount,
                new: newWordCount,
                change: wordCountChange
            };
            changes.hasChanges = true;
            changes.significant = wordCountChange > 500;
        }
        
        // Check link count
        const oldLinkCount = oldData.links?.length || 0;
        const newLinkCount = newData.links?.length || 0;
        
        if (Math.abs(newLinkCount - oldLinkCount) > 10) {
            changes.details.linkCount = {
                old: oldLinkCount,
                new: newLinkCount
            };
            changes.hasChanges = true;
        }
        
        return changes;
    }
    
    async sendNotification(url, changes) {
        // This would integrate with email, webhook, etc.
        console.log(`🚨 Website change detected: ${url}`);
        console.log(`Changes: ${JSON.stringify(changes, null, 2)}`);
        
        // Placeholder for actual notification implementation
        return {
            sent: true,
            method: 'console',
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = WebScraper;

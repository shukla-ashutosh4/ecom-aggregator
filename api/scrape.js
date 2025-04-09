// api/scrape.js
const { scrapeStore } = require('../dist/server/utils/scraper');
const { storage } = require('../dist/server/storage');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { url, storeId } = req.body;
    
    if (!url) {
      return res.status(400).json({ message: 'URL is required' });
    }
    
    // First check if we have cached results
    if (storeId) {
      const cachedResult = await storage.getLatestScrapeForStore(storeId);
      if (cachedResult) {
        return res.status(200).json({ products: cachedResult.products });
      }
    }
    
    // If no cache or no storeId, scrape fresh data
    const products = await scrapeStore(url);
    
    // Cache the results if we have a storeId
    if (storeId) {
      await storage.saveScrapedData(storeId, { products });
    }
    
    return res.status(200).json({ products });
  } catch (error) {
    console.error('Scraping error:', error);
    return res.status(500).json({ message: error.message || 'Failed to scrape store' });
  }
};

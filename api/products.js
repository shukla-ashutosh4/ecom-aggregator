// api/products.js
const { storage } = require('../dist/server/storage');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Get storeId from query parameters
    const storeId = parseInt(req.query.storeId);
    
    if (isNaN(storeId)) {
      return res.status(400).json({ message: 'Invalid store ID' });
    }
    
    const products = await storage.getProductsByStoreId(storeId);
    return res.status(200).json(products);
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

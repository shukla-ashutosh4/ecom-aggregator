// api/stores.js
const { storage } = require('../dist/server/storage');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      // Get all stores
      const stores = await storage.getStores();
      return res.status(200).json(stores);
    } else if (req.method === 'POST') {
      // Create a new store
      const store = await storage.createStore(req.body);
      return res.status(201).json(store);
    }
    
    // Method not allowed
    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

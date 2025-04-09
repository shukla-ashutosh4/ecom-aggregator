import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertStoreSchema, scrapeResultSchema } from "@shared/schema";
import { scrapeStore } from "./utils/scraper";
import { normalizeProducts } from "./utils/normalizer";

export async function registerRoutes(app: Express): Promise<Server> {
  // prefix all routes with /api
  const apiRouter = app.route("/api");
  
  // Get all predefined stores
  app.get("/api/stores", async (req: Request, res: Response) => {
    try {
      const stores = await storage.getStores();
      res.json(stores);
    } catch (error) {
      console.error("Error getting stores:", error);
      res.status(500).json({ message: "Failed to fetch stores" });
    }
  });
  
  // Add a new store
  app.post("/api/stores", async (req: Request, res: Response) => {
    try {
      const validatedData = insertStoreSchema.parse(req.body);
      const existingStore = await storage.getStoreByUrl(validatedData.url);
      
      if (existingStore) {
        return res.json(existingStore); // Return existing store if URL already exists
      }
      
      const newStore = await storage.createStore(validatedData);
      res.status(201).json(newStore);
    } catch (error) {
      console.error("Error creating store:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid store data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create store" });
      }
    }
  });
  
  // Scrape products from a store
  app.post("/api/scrape", async (req: Request, res: Response) => {
    try {
      console.log("Received scrape request");
      const schema = z.object({
        storeUrl: z.string().url()
      });
      
      const { storeUrl } = schema.parse(req.body);
      console.log("Scraping store URL:", storeUrl);
      
      // Check if store exists, if not create it
      let store = await storage.getStoreByUrl(storeUrl);
      
      if (!store) {
        // Extract domain name for store name
        const urlObj = new URL(storeUrl);
        const domainParts = urlObj.hostname.split('.');
        const name = domainParts.length > 1 ? 
          domainParts[domainParts.length - 2].charAt(0).toUpperCase() + domainParts[domainParts.length - 2].slice(1) : 
          urlObj.hostname;
        
        console.log("Creating new store:", name);
        store = await storage.createStore({
          name,
          url: storeUrl,
          logo: `https://www.google.com/s2/favicons?domain=${storeUrl}&sz=128`,
          isPreset: false
        });
      }
      
      // Check cache first (1 hour expiry)
      const cachedData = await storage.getLatestScrapeForStore(store.id);
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      if (cachedData && new Date(cachedData.timestamp) > oneHourAgo) {
        console.log("Returning cached data from:", cachedData.timestamp);
        console.log(`Cache contains ${cachedData.products.length} products`);
        return res.json(cachedData);
      }
      
      console.log("No cache or cache expired, scraping fresh data");
      // If no cache or cache expired, scrape new data
      try {
        const scrapedData = await scrapeStore(storeUrl);
        console.log(`Scraped ${scrapedData.length} products from ${storeUrl}`);
        
        // Normalize the data
        const normalizedProducts = normalizeProducts(scrapedData);
        console.log(`Normalized to ${normalizedProducts.length} products`);
        
        // Prepare the result
        const result: any = {
          storeName: store.name,
          storeUrl: store.url,
          products: normalizedProducts,
          timestamp: new Date().toISOString()
        };
        
        // Validate with the schema
        const validatedResult = scrapeResultSchema.parse(result);
        
        // Save to cache
        await storage.saveScrapedData(store.id, validatedResult);
        
        // Also save products to database
        const productsToInsert = normalizedProducts.map(product => ({
          storeId: store!.id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl || '',
          description: product.description || '',
          url: product.url || '',
          category: product.category || '',
          metadata: product.metadata || {},
          createdAt: new Date().toISOString()
        }));
        
        await storage.createProducts(productsToInsert);
        
        console.log("Successfully saved data and returning response");
        res.json(validatedResult);
      } catch (scrapeError) {
        console.error("Scraping error details:", scrapeError);
        throw new Error(`Scraping failed: ${scrapeError instanceof Error ? scrapeError.message : String(scrapeError)}`);
      }
    } catch (error) {
      console.error("Error scraping store:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          message: "Invalid input data", 
          errors: error.errors 
        });
      } else {
        res.status(500).json({ 
          message: "Failed to scrape store. The website might be using advanced protections against scraping or is not structured in a way we can parse.",
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  });

  // Get products for a specific store
  app.get("/api/stores/:storeId/products", async (req: Request, res: Response) => {
    try {
      const storeId = parseInt(req.params.storeId);
      
      if (isNaN(storeId)) {
        return res.status(400).json({ message: "Invalid store ID" });
      }
      
      const products = await storage.getProductsByStoreId(storeId);
      res.json(products);
    } catch (error) {
      console.error("Error getting products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

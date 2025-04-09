import { 
  Store, InsertStore, 
  Product, InsertProduct, 
  ScrapeResult, ProductData
} from "@shared/schema";

// Storage interface
export interface IStorage {
  // Store operations
  getStores(): Promise<Store[]>;
  getStoreByUrl(url: string): Promise<Store | undefined>;
  createStore(store: InsertStore): Promise<Store>;
  
  // Product operations
  getProductsByStoreId(storeId: number): Promise<Product[]>;
  createProducts(products: InsertProduct[]): Promise<Product[]>;
  
  // Scrape caching
  getLatestScrapeForStore(storeId: number): Promise<ScrapeResult | undefined>;
  saveScrapedData(storeId: number, data: ScrapeResult): Promise<ScrapeResult>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private stores: Map<number, Store>;
  private products: Map<number, Product>;
  private scrapeCache: Map<number, ScrapeResult>; // storeId -> latest scrape result
  private currentStoreId: number;
  private currentProductId: number;

  constructor() {
    this.stores = new Map();
    this.products = new Map();
    this.scrapeCache = new Map();
    this.currentStoreId = 1;
    this.currentProductId = 1;
    
    // Initialize with some preset stores
    const presetStores: InsertStore[] = [
      {
        name: "Amazon",
        url: "https://www.amazon.com",
        logo: "https://cdn.jsdelivr.net/npm/simple-icons@v8/icons/amazon.svg",
        isPreset: true
      },
      {
        name: "Walmart",
        url: "https://www.walmart.com",
        logo: "https://cdn.jsdelivr.net/npm/simple-icons@v8/icons/walmart.svg",
        isPreset: true
      },
      {
        name: "Best Buy",
        url: "https://www.bestbuy.com",
        logo: "https://cdn.jsdelivr.net/npm/simple-icons@v8/icons/bestbuy.svg",
        isPreset: true
      },
      {
        name: "Target",
        url: "https://www.target.com",
        logo: "https://cdn.jsdelivr.net/npm/simple-icons@v8/icons/target.svg",
        isPreset: true
      }
    ];
    
    presetStores.forEach(store => this.createStore(store));
  }

  async getStores(): Promise<Store[]> {
    return Array.from(this.stores.values());
  }

  async getStoreByUrl(url: string): Promise<Store | undefined> {
    return Array.from(this.stores.values()).find(
      store => store.url === url
    );
  }

  async createStore(insertStore: InsertStore): Promise<Store> {
    const id = this.currentStoreId++;
    const store: Store = { ...insertStore, id };
    this.stores.set(id, store);
    return store;
  }

  async getProductsByStoreId(storeId: number): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      product => product.storeId === storeId
    );
  }

  async createProducts(insertProducts: InsertProduct[]): Promise<Product[]> {
    const createdProducts: Product[] = [];
    
    for (const insertProduct of insertProducts) {
      const id = this.currentProductId++;
      const product: Product = { ...insertProduct, id };
      this.products.set(id, product);
      createdProducts.push(product);
    }
    
    return createdProducts;
  }

  async getLatestScrapeForStore(storeId: number): Promise<ScrapeResult | undefined> {
    return this.scrapeCache.get(storeId);
  }

  async saveScrapedData(storeId: number, data: ScrapeResult): Promise<ScrapeResult> {
    this.scrapeCache.set(storeId, data);
    return data;
  }
}

export const storage = new MemStorage();

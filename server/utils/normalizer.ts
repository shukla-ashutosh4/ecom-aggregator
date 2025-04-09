import { ProductData } from "@shared/schema";

/**
 * Normalizes product data from different e-commerce platforms
 * into a standardized format.
 */
export function normalizeProducts(products: any[]): ProductData[] {
  return products.map(product => {
    // Default normalized product template
    const normalizedProduct: ProductData = {
      name: '',
      price: '',
      imageUrl: '',
      description: '',
      url: '',
      category: '',
      metadata: {}
    };

    // Extract product name
    if (product.name || product.title) {
      normalizedProduct.name = product.name || product.title;
    } else if (product.productName || product.product_name) {
      normalizedProduct.name = product.productName || product.product_name;
    } else if (typeof product === 'string') {
      // Sometimes scrapers might just return text
      normalizedProduct.name = product;
    } else {
      normalizedProduct.name = 'Unknown Product';
    }

    // Extract price - preserve exact format from website
    if (product.price) {
      // Keep the exact original price format
      normalizedProduct.price = typeof product.price === 'string' 
        ? product.price 
        : String(product.price);
    } else if (product.priceText || product.price_text || product.cost) {
      // Use alternative price fields if available
      normalizedProduct.price = product.priceText || product.price_text || product.cost;
    } else {
      normalizedProduct.price = 'Price unavailable';
    }

    // Extract image URL
    if (product.imageUrl || product.image) {
      normalizedProduct.imageUrl = product.imageUrl || product.image;
    } else if (product.img || product.imageSrc || product.image_url) {
      normalizedProduct.imageUrl = product.img || product.imageSrc || product.image_url;
    }
    
    // Handle relative image URLs
    if (normalizedProduct.imageUrl && !normalizedProduct.imageUrl.startsWith('http')) {
      if (product.storeUrl) {
        const baseUrl = new URL(product.storeUrl);
        normalizedProduct.imageUrl = new URL(normalizedProduct.imageUrl, baseUrl.origin).toString();
      }
    }

    // Extract description
    if (product.description || product.desc) {
      normalizedProduct.description = product.description || product.desc;
    } else if (product.productDescription || product.product_description) {
      normalizedProduct.description = product.productDescription || product.product_description;
    }

    // Extract product URL
    if (product.url || product.link) {
      normalizedProduct.url = product.url || product.link;
    } else if (product.productUrl || product.product_url) {
      normalizedProduct.url = product.productUrl || product.product_url;
    }
    
    // Handle relative product URLs
    if (normalizedProduct.url && !normalizedProduct.url.startsWith('http')) {
      if (product.storeUrl) {
        const baseUrl = new URL(product.storeUrl);
        normalizedProduct.url = new URL(normalizedProduct.url, baseUrl.origin).toString();
      }
    }

    // Extract category
    if (product.category || product.categoryName) {
      normalizedProduct.category = product.category || product.categoryName;
    } else if (product.product_category || product.productCategory) {
      normalizedProduct.category = product.product_category || product.productCategory;
    }

    // Store any additional fields as metadata including original price
    const productMetadata: Record<string, any> = {};
    
    // Copy all fields that aren't in our main schema
    const excludedFields = ['name', 'price', 'imageUrl', 'description', 'url', 'category'];
    
    Object.keys(product).forEach(key => {
      if (!excludedFields.includes(key) && product[key] !== undefined) {
        productMetadata[key] = product[key];
      }
    });
    
    // Add raw price data to metadata
    productMetadata.originalPrice = product.price;
    normalizedProduct.metadata = productMetadata;

    return normalizedProduct;
  });
}

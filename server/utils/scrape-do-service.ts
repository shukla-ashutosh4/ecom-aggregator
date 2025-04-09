import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

export class ScrapeDoService {
  private apiKey: string;
  private baseUrl: string = 'https://api.scrape.do/';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Scrape a website using Scrape.do's API
   * @param url The URL to scrape
   * @returns HTML content of the page
   */
  async scrapeWebsite(url: string): Promise<string> {
    try {
      // Use different parameters depending on the site type for better results
      let apiUrl;
      
      if (url.includes('bestbuy.com')) {
        // Best Buy requires special parameters
        apiUrl = `${this.baseUrl}fetch?api_key=${this.apiKey}&url=${encodeURIComponent(url)}&render=true&browser=true`;
        console.log("Using specialized parameters for Best Buy");
      } else {
        // Standard parameters for other sites
        apiUrl = `${this.baseUrl}fetch?api_key=${this.apiKey}&url=${encodeURIComponent(url)}`;
      }
      
      console.log("Calling Scrape.do API for URL:", url);
      console.log("API Key (first 3 and last 3 chars):", 
                  this.apiKey ? this.apiKey.substring(0, 3) + "..." + this.apiKey.substring(this.apiKey.length - 3) : "Not provided");
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml'
        },
        timeout: 30000 // 30 seconds timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Scrape.do API error: ${response.status} ${errorText}`);
        throw new Error(`Scrape.do API error: ${response.status} ${errorText}`);
      }

      const data = await response.text();
      console.log(`Received HTML response from Scrape.do (${data.length} characters)`);
      return data;
    } catch (error) {
      console.error('Error using Scrape.do service:', error);
      throw new Error(`Failed to scrape using Scrape.do: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Extract products from HTML using cheerio
   * @param html HTML content to parse
   * @param storeUrl Original store URL for reference
   * @returns Array of extracted product data
   */
  extractProducts(html: string, storeUrl: string): any[] {
    const $ = cheerio.load(html);
    const extractedProducts: any[] = [];

    // Identify product containers using common selectors from popular e-commerce sites
    const productSelectors = [
      // Common grid/list view product containers
      '.product', '.product-item', '.product-card', '.item-product', '.product-grid-item',
      // Amazon-like selectors
      '.s-result-item', '.sg-col-inner', 
      // Walmart-like selectors
      '[data-item-id]', '.search-result-gridview-item',
      // Best Buy-like selectors
      '.sku-item', '.list-item',
      // General shop and product listing patterns
      '[class*="product"]', '[class*="item"]', '[class*="card"]',
      // Even more generic
      '.col', '.grid-item', '.cell', '.box'
    ];

    // Try to find product containers
    let productContainers: any = $();
    for (const selector of productSelectors) {
      const containers = $(selector);
      if (containers.length > 0) {
        productContainers = containers;
        break;
      }
    }

    // If no product containers found by class, look for repeating elements with images and prices
    if (productContainers.length === 0) {
      // Find all elements that contain price patterns
      const priceElements = $('body').find(':contains($):contains(.)').filter(function() {
        const text = $(this).text().trim();
        return /\$\d+\.\d+/.test(text) || /\$\d+/.test(text);
      });

      if (priceElements.length > 0) {
        // Map from elements to their parent containers
        const parentElements = new Map();
        
        priceElements.each(function() {
          // Find closest parent that might be a product container
          let parent = $(this).parent();
          for (let i = 0; i < 3; i++) { // Check up to 3 levels up
            if (parent.find('img').length) {
              // This parent has both price text and an image, likely a product
              parentElements.set(parent[0], parent);
              break;
            }
            parent = parent.parent();
          }
        });
        
        productContainers = $();
        parentElements.forEach(el => {
          productContainers = productContainers.add(el);
        });
      }
    }

    // If still no product containers, try more aggressive approaches
    if (productContainers.length === 0) {
      // Look for any elements that contain an image and some text
      $('body').find('div, li, article').each(function() {
        const $element = $(this);
        if ($element.find('img').length && $element.text().trim()) {
          productContainers = productContainers.add($element);
        }
      });
    }

    // Process each product container
    productContainers.each((index: number, element: any) => {
      const $element = $(element);
      
      // Skip if nested in another product container
      for (let parent = $element.parent(); parent.length; parent = parent.parent()) {
        if (productContainers.is(parent)) {
          return;
        }
      }

      // Extract product data
      const product: any = { storeUrl };

      // Extract product name
      const nameSelectors = ['h2', 'h3', 'h4', '.name', '.title', '[class*="name"]', '[class*="title"]'];
      let name = '';
      
      for (const selector of nameSelectors) {
        const nameEl = $element.find(selector).first();
        if (nameEl.length) {
          name = nameEl.text().trim();
          break;
        }
      }
      
      // If no name found in child elements, check if the container itself has a short text
      if (!name) {
        const text = $element.text().trim();
        if (text.length < 100) {  // Assuming a reasonable product name length
          name = text;
        }
      }
      
      if (name) {
        product.name = name;
      }

      // Extract price - maintain original format
      let price = '';
      // Match a wider range of price formats, including different currencies
      const priceRegex = /[\$\€\£\¥\₹]\s?\d+([.,]\d{1,2})?|\d+([.,]\d{1,2})?\s?[\$\€\£\¥\₹]/;
      
      // First, try to find elements with common price class names
      const priceSelectors = [
        '.price', '[class*="price"]', '.amount', '[class*="cost"]', '[class*="amount"]',
        '.current-price', '.product-price', '.sale-price', '.discounted-price',
        // Specific selectors from popular sites
        '.a-price', '.a-offscreen', '.price_color', '.product_price'
      ];
      
      // Keep track of the element that contains the price
      let priceElement = null;
      
      for (const selector of priceSelectors) {
        const priceEl = $element.find(selector).first();
        if (priceEl.length) {
          const text = priceEl.text().trim();
          // Save the full text as the price to maintain original format
          if (text && (priceRegex.test(text) || /^\d+([.,]\d{1,2})?$/.test(text))) {
            price = text;
            priceElement = priceEl;
            break;
          }
        }
      }
      
      // If no price found with selectors, check all text in the container
      if (!price) {
        // Look for elements that might contain a price
        $element.find('*').each(function() {
          const text = $(this).text().trim();
          if (text && priceRegex.test(text)) {
            // Check if this isn't a container with other elements
            if ($(this).children().length === 0 || $(this).children().first().is('span')) {
              price = text;
              priceElement = $(this);
              return false; // Break the loop
            }
          }
        });
      }
      
      // Last resort: check all container text
      if (!price) {
        const text = $element.text().trim();
        const match = text.match(priceRegex);
        if (match) {
          price = match[0];
        }
      }
      
      if (price) {
        // Store the exact price string, preserving format
        product.price = price;
        
        // If the price is inside a specific element, also check for other price elements
        // (like original/sale price) in the same container
        if (priceElement) {
          const parentElement = priceElement.parent();
          
          // Check for crossed-out prices (original price before discount)
          const originalPriceSelectors = [
            '.original-price', '.was-price', '.regular-price', '.old-price',
            '[class*="original"]', '[class*="was"]', '[class*="regular"]', '[class*="old"]',
            'del', 's', 'strike'
          ];
          
          for (const selector of originalPriceSelectors) {
            const originalPriceEl = parentElement.find(selector).first();
            if (originalPriceEl.length) {
              const originalText = originalPriceEl.text().trim();
              if (originalText && priceRegex.test(originalText)) {
                product.originalPrice = originalText;
                break;
              }
            }
          }
        }
      }

      // Extract image
      const imgElement = $element.find('img').first();
      if (imgElement.length) {
        // Try multiple image attributes (some sites use data- attributes)
        const imgUrl = imgElement.attr('src') || 
                       imgElement.attr('data-src') || 
                       imgElement.attr('data-original') ||
                       imgElement.attr('srcset')?.split(' ')?.[0];
        
        if (imgUrl) {
          product.imageUrl = imgUrl;
        }
      }

      // Extract product URL
      const linkElement = $element.find('a').first();
      if (linkElement.length) {
        const productUrl = linkElement.attr('href');
        if (productUrl) {
          // Handle relative URLs
          product.url = productUrl.startsWith('http') ? 
            productUrl : 
            new URL(productUrl, new URL(storeUrl).origin).toString();
        }
      }

      // Skip if we couldn't extract enough data
      if (product.name || product.price || product.imageUrl) {
        extractedProducts.push(product);
      }
    });

    // If no products found using DOM approach, try to extract structured data
    if (extractedProducts.length === 0) {
      $('script[type="application/ld+json"]').each((i, element) => {
        try {
          const jsonData = JSON.parse($(element).html() || '{}');
          
          // Check if it's product data or a product list
          if (jsonData['@type'] === 'Product') {
            const product: any = {
              name: jsonData.name,
              storeUrl
            };
            
            if (jsonData.offers) {
              // Extract price from structured data
              let priceValue;
              if (Array.isArray(jsonData.offers)) {
                priceValue = jsonData.offers[0]?.price || jsonData.offers[0]?.priceSpecification?.price;
                // Store original currency symbol if available
                if (jsonData.offers[0]?.priceCurrency) {
                  product.priceCurrency = jsonData.offers[0].priceCurrency;
                }
              } else {
                priceValue = jsonData.offers.price || jsonData.offers.priceSpecification?.price;
                // Store original currency symbol if available
                if (jsonData.offers.priceCurrency) {
                  product.priceCurrency = jsonData.offers.priceCurrency;
                }
              }
              
              // Format the price with the currency symbol if available
              if (priceValue) {
                if (product.priceCurrency) {
                  let currencySymbol = '$'; // Default
                  
                  // Map currency codes to symbols
                  const currencyMap: {[key: string]: string} = {
                    'USD': '$',
                    'EUR': '€',
                    'GBP': '£',
                    'JPY': '¥',
                    'INR': '₹'
                  };
                  
                  if (currencyMap[product.priceCurrency]) {
                    currencySymbol = currencyMap[product.priceCurrency];
                  }
                  
                  product.price = `${currencySymbol}${priceValue}`;
                } else {
                  product.price = `$${priceValue}`;
                }
              }
            }
            
            if (jsonData.image) {
              product.imageUrl = Array.isArray(jsonData.image) ? 
                jsonData.image[0] : jsonData.image;
            }
            
            if (jsonData.description) {
              product.description = jsonData.description;
            }
            
            extractedProducts.push(product);
          } else if (jsonData['@type'] === 'ItemList' && Array.isArray(jsonData.itemListElement)) {
            jsonData.itemListElement.forEach((item: any) => {
              if (item.item && item.item['@type'] === 'Product') {
                const product: any = {
                  name: item.item.name,
                  storeUrl
                };
                
                if (item.item.offers) {
                  // Extract price from structured data
                  let priceValue;
                  if (Array.isArray(item.item.offers)) {
                    priceValue = item.item.offers[0]?.price || item.item.offers[0]?.priceSpecification?.price;
                    // Store original currency symbol if available
                    if (item.item.offers[0]?.priceCurrency) {
                      product.priceCurrency = item.item.offers[0].priceCurrency;
                    }
                  } else {
                    priceValue = item.item.offers.price || item.item.offers.priceSpecification?.price;
                    // Store original currency symbol if available
                    if (item.item.offers.priceCurrency) {
                      product.priceCurrency = item.item.offers.priceCurrency;
                    }
                  }
                  
                  // Format the price with the currency symbol if available
                  if (priceValue) {
                    if (product.priceCurrency) {
                      let currencySymbol = '$'; // Default
                      
                      // Map currency codes to symbols
                      const currencyMap: {[key: string]: string} = {
                        'USD': '$',
                        'EUR': '€',
                        'GBP': '£',
                        'JPY': '¥',
                        'INR': '₹'
                      };
                      
                      if (currencyMap[product.priceCurrency]) {
                        currencySymbol = currencyMap[product.priceCurrency];
                      }
                      
                      product.price = `${currencySymbol}${priceValue}`;
                    } else {
                      product.price = `$${priceValue}`;
                    }
                  }
                }
                
                if (item.item.image) {
                  product.imageUrl = Array.isArray(item.item.image) ? 
                    item.item.image[0] : item.item.image;
                }
                
                if (item.item.description) {
                  product.description = item.item.description;
                }
                
                extractedProducts.push(product);
              }
            });
          }
        } catch (e) {
          // Ignore JSON parsing errors for LD+JSON
        }
      });
    }

    return extractedProducts;
  }
}
import fetch from "node-fetch";
import * as cheerio from "cheerio";
import { ProductData } from "@shared/schema";
import { ScrapeDoService } from "./scrape-do-service";

// Get the API key from environment variables
const SCRAPE_DO_API_KEY = process.env.SCRAPE_DO_API_KEY;

if (!SCRAPE_DO_API_KEY) {
  console.warn(
    "Warning: SCRAPE_DO_API_KEY environment variable is not set. Scraping functionality may be limited.",
  );
}

const scrapeDoService = new ScrapeDoService(SCRAPE_DO_API_KEY || "");

/**
 * Scrape product data from a given e-commerce website URL
 * This uses a combination of common patterns found in e-commerce sites
 * and the Scrape.do service for better results
 */
export async function scrapeStore(url: string): Promise<any[]> {
  try {
    // Use Scrape.do service if API key is available
    if (SCRAPE_DO_API_KEY) {
      console.log("Using Scrape.do service for better scraping results");
      try {
        const html = await scrapeDoService.scrapeWebsite(url);
        return scrapeDoService.extractProducts(html, url);
      } catch (scrapeDoError) {
        console.error(
          "Scrape.do service failed, falling back to direct scraping:",
          scrapeDoError,
        );
        // Fall back to direct scraping if Scrape.do fails
      }
    }

    // Direct scraping fallback (original implementation)
    console.log(
      "Using direct scraping (no Scrape.do API key provided or fallback)",
    );
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        Referer: "https://www.google.com/",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch store data: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const extractedProducts: any[] = [];
    const storeUrl = url;

    // Identify product containers using common selectors from popular e-commerce sites
    const productSelectors = [
      // Common grid/list view product containers
      ".product",
      ".product-item",
      ".product-card",
      ".item-product",
      ".product-grid-item",
      // Amazon-like selectors
      ".s-result-item",
      ".sg-col-inner",
      // Walmart-like selectors
      "[data-item-id]",
      ".search-result-gridview-item",
      // Best Buy-like selectors
      ".sku-item",
      ".list-item",
      // General shop and product listing patterns
      '[class*="product"]',
      '[class*="item"]',
      '[class*="card"]',
      // Even more generic
      ".col",
      ".grid-item",
      ".cell",
      ".box",
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
      const priceElements = $("body")
        .find(":contains($):contains(.)")
        .filter(function () {
          const text = $(this).text().trim();
          return /\$\d+\.\d+/.test(text) || /\$\d+/.test(text);
        });

      // Get parent elements that might be product containers
      const potentialContainers = new Set<any>();
      priceElements.each(function () {
        let parent = $(this).parent();
        for (let i = 0; i < 4; i++) {
          // Check up to 4 levels up
          potentialContainers.add(parent.get(0));
          parent = parent.parent();
        }
      });

      // Convert set to array and filter to similar elements (product cards usually have same structure)
      const containerArray = Array.from(potentialContainers);
      const containersByTag: Record<string, any[]> = {};

      for (const container of containerArray) {
        const tagName = container.tagName;
        if (!containersByTag[tagName]) {
          containersByTag[tagName] = [];
        }
        containersByTag[tagName].push(container);
      }

      // Use the tag group with most elements as likely product containers
      let maxCount = 0;
      let bestTag = "";

      for (const [tag, elements] of Object.entries(containersByTag)) {
        if (elements.length > maxCount) {
          maxCount = elements.length;
          bestTag = tag;
        }
      }

      if (maxCount > 0) {
        productContainers = $(containersByTag[bestTag]);
      }
    }

    // If still no product containers, try more aggressive approaches
    if (productContainers.length === 0) {
      // Look for any elements that contain an image and some text
      $("body")
        .find("div, li, article")
        .each(function () {
          const $element = $(this);
          if ($element.find("img").length && $element.text().trim()) {
            productContainers = productContainers.add($element);
          }
        });
    }

    // Process each product container
    productContainers.each((index: number, element: any) => {
      const $element = $(element);

      // Skip if nested in another product container
      for (
        let parent = $element.parent();
        parent.length;
        parent = parent.parent()
      ) {
        if (productContainers.is(parent)) {
          return;
        }
      }

      // Extract product data
      const product: any = { storeUrl };

      // Extract name/title
      const nameSelectors = [
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        ".product-name",
        ".product-title",
        ".item-title",
        '[class*="title"]',
        '[class*="name"]',
        "a[title]",
      ];

      let productName = "";
      for (const selector of nameSelectors) {
        const element = $element.find(selector).first();
        if (element.length) {
          productName = element.text().trim();
          break;
        }
      }

      if (!productName) {
        // If still no name, try the alt text of the image
        const imgAlt = $element.find("img").attr("alt");
        if (imgAlt) {
          productName = imgAlt.trim();
        }
      }

      if (productName) {
        product.name = productName;
      }

      // Extract price
      const priceSelectors = [
        ".price",
        '[class*="price"]',
        ".amount",
        '[class*="amount"]',
        '[class*="cost"]',
        '[class*="value"]',
        "span:contains($)",
      ];

      let price = "";
      for (const selector of priceSelectors) {
        const priceElem = $element.find(selector).first();
        if (priceElem.length) {
          price = priceElem.text().trim();
          break;
        }
      }

      // If no price found through selectors, look for price patterns in text
      if (!price) {
        const elementText = $element.text();
        const priceMatch = elementText.match(/\$\s*(\d+(?:\.\d{2})?)/);
        if (priceMatch) {
          price = priceMatch[0];
        }
      }

      if (price) {
        product.price = price;
      }

      // Extract image
      const imgElement = $element.find("img").first();
      if (imgElement.length) {
        // Try multiple image attributes (some sites use data- attributes)
        const imgUrl =
          imgElement.attr("src") ||
          imgElement.attr("data-src") ||
          imgElement.attr("data-original") ||
          imgElement.attr("srcset")?.split(" ")?.[0];

        if (imgUrl) {
          product.imageUrl = imgUrl;
        }
      }

      // Extract product URL
      const linkElement = $element.find("a").first();
      if (linkElement.length) {
        const productUrl = linkElement.attr("href");
        if (productUrl) {
          // Handle relative URLs
          product.url = productUrl.startsWith("http")
            ? productUrl
            : new URL(productUrl, new URL(url).origin).toString();
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
          const jsonData = JSON.parse($(element).html() || "{}");

          // Check if it's product data or a product list
          if (jsonData["@type"] === "Product") {
            const product: any = {
              name: jsonData.name,
              storeUrl,
            };

            if (jsonData.offers) {
              if (Array.isArray(jsonData.offers)) {
                product.price = jsonData.offers[0]?.price;
              } else {
                product.price = jsonData.offers.price;
              }
            }

            if (jsonData.image) {
              product.imageUrl = Array.isArray(jsonData.image)
                ? jsonData.image[0]
                : jsonData.image;
            }

            if (jsonData.description) {
              product.description = jsonData.description;
            }

            extractedProducts.push(product);
          } else if (
            jsonData["@type"] === "ItemList" &&
            Array.isArray(jsonData.itemListElement)
          ) {
            jsonData.itemListElement.forEach((item: any) => {
              if (item.item && item.item["@type"] === "Product") {
                const product: any = {
                  name: item.item.name,
                  storeUrl,
                };

                if (item.item.offers) {
                  product.price = item.item.offers.price;
                }

                if (item.item.image) {
                  product.imageUrl = Array.isArray(item.item.image)
                    ? item.item.image[0]
                    : item.item.image;
                }

                extractedProducts.push(product);
              }
            });
          }
        } catch (e) {
          // Ignore JSON parsing errors
        }
      });
    }

    return extractedProducts;
  } catch (error) {
    console.error("Error scraping store:", error);
    throw error;
  }
}

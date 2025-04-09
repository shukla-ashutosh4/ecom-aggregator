import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ProductData, ScrapeResult, Store } from "@shared/schema";
import { ProductGrid } from "@/components/product-grid";
import { Loader } from "@/components/loader";
import { ErrorMessage } from "@/components/error-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { ShoppingBasket, ArrowLeft, Search, Filter, SlidersHorizontal } from "lucide-react";

export default function Results() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Get the URL parameters directly
  const storeUrl = window.location.search 
    ? new URLSearchParams(window.location.search).get("store") 
    : null;
  
  // Go home if no store is selected - only on initial mount
  useEffect(() => {
    if (!storeUrl) {
      window.location.href = '/';
    }
  }, []);
  
  // State for filtering and sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("default");
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  
  // Get store details
  const { data: stores = [] } = useQuery<Store[]>({
    queryKey: ["/api/stores"],
  });
  
  const selectedStore = stores.find((s) => s.url === storeUrl);
  
  // Fetch scraped data
  const {
    data: scrapeResult,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<ScrapeResult>({
    queryKey: ["/api/scrape", storeUrl],
    enabled: !!storeUrl,
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: async () => {
      if (!storeUrl) throw new Error("No store URL provided");
      
      try {
        const response = await apiRequest("POST", "/api/scrape", {
          storeUrl: storeUrl
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to scrape products");
        }
        
        return await response.json();
      } catch (err) {
        console.error("Error fetching scraped data:", err);
        throw err;
      }
    }
  });
  
  // Handle filtered and sorted products
  const [filteredProducts, setFilteredProducts] = useState<ProductData[]>([]);
  
  useEffect(() => {
    if (!scrapeResult?.products) {
      return;
    }
    
    let filtered = [...scrapeResult.products];
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        product => 
          product.name.toLowerCase().includes(query) || 
          (product.description && product.description.toLowerCase().includes(query)) ||
          (product.category && product.category.toLowerCase().includes(query))
      );
    }
    
    // Apply sorting
    switch (sortOrder) {
      case "price-asc":
        filtered.sort((a, b) => {
          const priceA = parseFloat(a.price.replace(/[^0-9.]/g, "")) || 0;
          const priceB = parseFloat(b.price.replace(/[^0-9.]/g, "")) || 0;
          return priceA - priceB;
        });
        break;
      case "price-desc":
        filtered.sort((a, b) => {
          const priceA = parseFloat(a.price.replace(/[^0-9.]/g, "")) || 0;
          const priceB = parseFloat(b.price.replace(/[^0-9.]/g, "")) || 0;
          return priceB - priceA;
        });
        break;
      case "name-asc":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }
    
    setFilteredProducts(filtered);
  }, [scrapeResult, searchQuery, sortOrder]);

  if (!storeUrl) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
              <img src="/favicon.ico" alt="Logo" className="h-8 w-8" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Store Selected</h2>
          <p className="text-gray-600 mb-4">
            You need to select a store to view its products.
          </p>
          <a href="/">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back to Home
            </Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <a href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              </a>
              <div className="ml-4 flex items-center">
                <img src="/favicon.ico" alt="Logo" className="h-6 w-6" />
                <h1 className="ml-2 text-xl font-bold text-gray-900">EcomScrape</h1>
              </div>
            </div>
            {selectedStore && (
              <div className="flex items-center">
                {selectedStore.logo && (
                  <img
                    src={selectedStore.logo}
                    alt={selectedStore.name}
                    className="h-6 w-6 mr-2"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <span className="font-medium text-gray-700">{selectedStore.name}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <Loader message="Fetching products..." />
        ) : isError ? (
          <ErrorMessage
            title="Failed to load products"
            message={error instanceof Error ? error.message : "An unknown error occurred"}
            onRetry={refetch}
          />
        ) : (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {scrapeResult?.storeName} Products
                </h2>
                <div className="flex items-center mt-1">
                  <Badge variant="outline" className="rounded-full">
                    {filteredProducts.length} products
                  </Badge>
                  {scrapeResult?.timestamp && (
                    <span className="text-xs text-gray-500 ml-2">
                      Last updated: {new Date(scrapeResult.timestamp).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Search products..."
                    className="pl-9 w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="relative">
                  <Select value={sortOrder} onValueChange={setSortOrder}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="price-asc">Price: Low to High</SelectItem>
                      <SelectItem value="price-desc">Price: High to Low</SelectItem>
                      <SelectItem value="name-asc">Name: A to Z</SelectItem>
                      <SelectItem value="name-desc">Name: Z to A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <ProductGrid
                products={filteredProducts}
                storeName={scrapeResult?.storeName}
              />
              
              {filteredProducts.length === 0 && searchQuery && (
                <div className="text-center py-12">
                  <Search className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No matching products</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Try adjusting your search or filters to find what you're looking for.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4" 
                    onClick={() => setSearchQuery("")}
                  >
                    Clear Search
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} EcomScrape - E-Commerce Store Aggregator
          </p>
        </div>
      </footer>
    </div>
  );
}

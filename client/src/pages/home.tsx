import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Store } from "@shared/schema";
import { StoreSelector } from "@/components/store-selector";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/loader";
import { apiRequest } from "@/lib/queryClient";
import { ShoppingBasket, Layers, Globe } from "lucide-react";

export default function Home() {
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const handleScrape = async () => {
    if (!selectedStore) {
      toast({
        title: "No Store Selected",
        description: "Please select a store or enter a custom URL first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Simply navigate to the results page with the store URL
      // The results page will handle the API call
      const encodedUrl = encodeURIComponent(selectedStore.url);
      
      // Update the cache if possible, but don't wait for it to complete
      apiRequest("POST", "/api/scrape", {
        storeUrl: selectedStore.url
      }).catch(err => {
        console.error("Pre-caching error:", err);
        // We ignore this error since results page will retry anyway
      });
      
      // Navigate immediately
      navigate(`/results?store=${encodedUrl}`);
      
    } catch (error) {
      // This catch is mainly for navigation errors
      console.error("Navigation error:", error);
      toast({
        title: "Navigation Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img src="/favicon.ico" alt="Logo" className="h-8 w-8" />
              <h1 className="ml-2 text-2xl font-bold text-gray-900">EcomScrape</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <Loader message="Scraping products from store..." />
        ) : (
          <>
            <div className="text-center mb-10">
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                E-Commerce Store Aggregator
              </h2>
              <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                Select a store from our presets or enter any e-commerce URL to scrape and view products
              </p>
            </div>

            <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
              <div className="flex items-center mb-6">
                <Layers className="h-6 w-6 text-primary-500 mr-2" />
                <h2 className="text-xl font-bold text-gray-900">Select a Store</h2>
              </div>
              
              <StoreSelector 
                onStoreSelect={setSelectedStore} 
                selectedStoreUrl={selectedStore?.url}
              />
              
              {selectedStore && (
                <div className="mt-6 flex justify-center">
                  <a href={`/results?store=${encodeURIComponent(selectedStore.url)}`}>
                    <Button size="lg">
                      <Globe className="mr-2 h-5 w-5" />
                      View Products from {selectedStore.name}
                    </Button>
                  </a>
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-2">How it works</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-600">
                <li>Select an e-commerce store from our presets or enter a custom URL</li>
                <li>Our system will automatically scrape and extract all products from the selected store</li>
                <li>View and browse the extracted products in a standardized format</li>
                <li>Compare products across different stores</li>
              </ol>
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

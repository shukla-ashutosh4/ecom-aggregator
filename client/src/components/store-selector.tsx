import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Store } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Search, Globe, AlertTriangle } from "lucide-react";

interface StoreCardProps {
  store: Store;
  onClick: (store: Store) => void;
  isActive?: boolean;
}

function StoreCard({ store, onClick, isActive }: StoreCardProps) {
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isActive ? 'ring-2 ring-primary-500 ring-offset-2' : ''
      }`}
      onClick={() => onClick(store)}
    >
      <CardContent className="flex items-center p-4">
        <div className="flex-shrink-0 mr-4">
          {store.logo ? (
            <img 
              src={store.logo} 
              alt={store.name} 
              className="w-12 h-12 object-contain"
              onError={(e) => {
                e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDZiNmQ0IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtc3RvcmVmcm9udCI+PHBhdGggZD0iTTIgN2gyMCIvPjxwYXRoIGQ9Ik01IDE5aDEwYTMgMyAwIDAgMCAzLTMgMyAzIDAgMCAwLTMtM0g1YTMgMyAwIDAgMC0zIDMgMyAzIDAgMCAwIDMgM1oiLz48cGF0aCBkPSJNNCA3djEyIi8+PHBhdGggZD0iTTIwIDdWNGMwLS41NTItLjQ0OC0xLTEtMUg1YTEgMSAwIDAgMC0xIDF2MyIvPjxwYXRoIGQ9Ik0xMCA1djE0Ii8+PHBhdGggZD0iTTIwIDdWNC4xYzAgLTEgLTQgLTIgLTEwIDBzLTkuOTk5IDAtOS45OTkgMFY3Ii8+PC9zdmc+";
              }}
            />
          ) : (
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <Globe className="text-gray-400" size={24} />
            </div>
          )}
        </div>
        <div className="flex-grow">
          <h3 className="font-medium text-gray-900">{store.name}</h3>
          <p className="text-xs text-gray-500 truncate">{store.url}</p>
        </div>
      </CardContent>
    </Card>
  );
}

interface StoreSelectorProps {
  onStoreSelect: (store: Store) => void;
  selectedStoreUrl?: string;
}

export function StoreSelector({ onStoreSelect, selectedStoreUrl }: StoreSelectorProps) {
  const [customUrl, setCustomUrl] = useState("");
  const [activeTab, setActiveTab] = useState("preset");
  const { toast } = useToast();

  // Fetch preset stores
  const { data: stores = [], isLoading: isLoadingStores } = useQuery({
    queryKey: ["/api/stores"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Submit custom URL
  const handleCustomUrlSubmit = async () => {
    try {
      if (!customUrl.trim()) {
        toast({
          title: "URL Required",
          description: "Please enter a valid store URL",
          variant: "destructive",
        });
        return;
      }

      // Validate and normalize URL
      let normalizedUrl = customUrl.trim();
      if (!normalizedUrl.startsWith('http')) {
        normalizedUrl = `https://${normalizedUrl}`;
      }

      try {
        // Check if it's a valid URL
        new URL(normalizedUrl);
      } catch (e) {
        toast({
          title: "Invalid URL",
          description: "Please enter a valid URL (e.g., https://www.example.com)",
          variant: "destructive",
        });
        return;
      }

      // Submit to backend for processing
      const response = await apiRequest("POST", "/api/stores", {
        name: new URL(normalizedUrl).hostname.replace('www.', ''),
        url: normalizedUrl,
        logo: `https://www.google.com/s2/favicons?domain=${normalizedUrl}&sz=128`,
        isPreset: false
      });

      const newStore = await response.json();
      onStoreSelect(newStore);
      
      toast({
        title: "Store Added",
        description: `${newStore.name} has been added successfully.`,
      });
    } catch (error) {
      console.error("Error adding custom store:", error);
      toast({
        title: "Error Adding Store",
        description: "There was a problem adding this store. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Tabs defaultValue="preset" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="preset">Preset Stores</TabsTrigger>
          <TabsTrigger value="custom">Custom URL</TabsTrigger>
        </TabsList>
        
        <TabsContent value="preset" className="space-y-4">
          {isLoadingStores ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
                <span className="sr-only">Loading stores...</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">Loading preset stores...</p>
            </div>
          ) : stores.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No preset stores found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adding a custom store URL instead.</p>
              <div className="mt-6">
                <Button onClick={() => setActiveTab("custom")}>
                  Add Custom URL
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stores.map((store: Store) => (
                <StoreCard
                  key={store.id}
                  store={store}
                  onClick={onStoreSelect}
                  isActive={store.url === selectedStoreUrl}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="custom">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="store-url">Enter E-Commerce Store URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="store-url"
                      placeholder="https://www.example.com"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      className="flex-grow"
                    />
                    <Button onClick={handleCustomUrlSubmit}>
                      <Search className="h-4 w-4 mr-2" />
                      Scrape
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the full URL of any e-commerce store to scrape products
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

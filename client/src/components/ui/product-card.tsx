import { ProductData } from "@shared/schema";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

interface ProductCardProps {
  product: ProductData;
  storeName?: string;
}

export function ProductCard({ product, storeName }: ProductCardProps) {
  const defaultImage = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjY2NjIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtaW1hZ2UiPjxyZWN0IHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgeD0iMyIgeT0iMyIgcng9IjIiIHJ5PSIyIi8+PGNpcmNsZSBjeD0iOC41IiBjeT0iOC41IiByPSIxLjUiLz48cGF0aCBkPSJtMjEgMTUtMy0zLTYgNi04LTgiLz48L3N2Zz4=";

  return (
    <Card className="h-full overflow-hidden flex flex-col hover:shadow-lg transition-shadow duration-200">
      <div className="relative pt-[100%] bg-gray-50 overflow-hidden">
        <img
          src={product.imageUrl || defaultImage}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-contain p-4"
          onError={(e) => {
            e.currentTarget.src = defaultImage;
          }}
        />
      </div>
      <CardContent className="flex-grow p-4">
        {storeName && (
          <Badge variant="outline" className="mb-2 text-xs">
            {storeName}
          </Badge>
        )}
        <h3 className="font-medium text-sm sm:text-base line-clamp-2 mb-2 h-10">
          {product.name}
        </h3>
        {product.category && (
          <div className="text-xs text-gray-500 mb-2">{product.category}</div>
        )}
        <div className="text-lg font-bold text-primary-600">{product.price}</div>
        {product.description && (
          <p className="text-xs text-gray-600 mt-2 line-clamp-2">{product.description}</p>
        )}
      </CardContent>
      {product.url && (
        <CardFooter className="p-4 pt-0">
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary-600 hover:text-primary-800 flex items-center gap-1"
          >
            View Product <ExternalLink size={14} />
          </a>
        </CardFooter>
      )}
    </Card>
  );
}

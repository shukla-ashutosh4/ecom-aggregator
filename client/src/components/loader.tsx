import { useState, useEffect } from "react";

interface LoaderProps {
  message?: string;
}

export function Loader({ message = "Loading data..." }: LoaderProps) {
  const [dots, setDots] = useState("");
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? "" : prev + ".");
    }, 500);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-t-4 border-b-4 border-primary-500"></div>
        <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-t-4 border-b-4 border-primary-300 animate-spin"></div>
      </div>
      <p className="mt-4 text-center text-gray-600 text-lg">
        {message}{dots}
      </p>
      <p className="mt-2 text-center text-gray-500 text-sm max-w-md">
        This may take a moment depending on the size of the store and its complexity.
      </p>
    </div>
  );
}

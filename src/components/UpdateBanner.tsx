import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

const UpdateBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  
  if (!isVisible) return null;
  
  return (
    <div className="bg-blue-600 text-white">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle size={18} className="mr-2" />
            <p className="text-sm font-medium">
              <span className="mr-2">New research added:</span>
              <a href="#digestive-system" className="underline hover:text-blue-100 transition-colors">
                Impact of microplastics on digestive enzymes
              </a>
            </p>
          </div>
          <button 
            onClick={() => setIsVisible(false)} 
            className="text-white hover:text-blue-100 transition-colors"
            aria-label="Dismiss"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateBanner;